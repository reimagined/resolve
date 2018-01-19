import { expect } from 'chai';
// import redis from 'redis-mock';
import redis from 'redis';

import createRedisAdapter from '../src/index';
import nativeRedisAdapter from '../src/adapter';

const DEFAULT_KEY = 'store';

describe('Read model redis adapter', () => {
    let adapter, getReadable, getWritable;

    let repository = {
        client: redis.createClient(),
        metaName: '__ResolveMeta__',
        lastTimestampKey: '__ResolveLastTimestampMeta__',
        lastTimestamp: 0
    };
    repository.connectionPromise = async () => {
        repository.nativeAdapter = await nativeRedisAdapter(repository);
    };

    beforeEach(async () => {
        await new Promise((resolve, reject) => {
            repository.client.flushall((e, val) => (e ? reject(e) : resolve(val)));
        });

        adapter = createRedisAdapter({}, {}, repository.client);

        adapter.buildProjection({
            Init: async (store) => {
                getWritable = async () => store;
                try {
                    store.hset(DEFAULT_KEY, 1, { i: 100, s: 'aaa', text: 'Initial', a: [] });
                    store.hset(DEFAULT_KEY, 2, { i: 200, s: 'bbb', text: 'First text', a: [] });
                    store.hset(DEFAULT_KEY, 3, { i: 100, s: 'bbb', text: 'Second text', a: [] });
                    store.hset(DEFAULT_KEY, 4, { i: 100, s: 'bbb', text: 'Last text', a: [123] });
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.log(`error: ${error}`);
                }
            },
            TestEvent: async (store, event) => {
                if (event.crashFlag) {
                    throw new Error('Test crashing event');
                }
                const TestDictionary = await store.dictionary(DEFAULT_KEY);

                await TestDictionary.insert({
                    text: event.text
                });
            }
        });

        const readSide = adapter.init();
        getReadable = readSide.getReadable;

        await getReadable();
    });

    it('should have appropriate API', async () => {
        expect(adapter.buildProjection).to.be.a('function');
        expect(adapter.init).to.be.a('function');
        expect(adapter.reset).to.be.a('function');

        const readable = await getReadable();
        expect(readable.hset).to.be.a('function');

        const writable = await getWritable();
        expect(writable.hset).to.be.a('function');
        expect(writable.hget).to.be.a('function');
    });

    it('readable', async () => {
        const readable = await getReadable();

        const record = await readable.hget(DEFAULT_KEY, 2);
        expect(record.i).to.be.equal(200);
        expect(record.s).to.be.equal('bbb');
    });

    it('writable', async () => {
        const writable = await getWritable();

        let record;
        record = await writable.hget(DEFAULT_KEY, 777);
        expect(record).to.be.equal(null);

        await writable.hset(DEFAULT_KEY, 777, { bingo: true });

        record = await writable.hget(DEFAULT_KEY, 777);
        expect(record.bingo).to.be.equal(true);

        await writable.del(DEFAULT_KEY);
        expect(await writable.hget(DEFAULT_KEY, 777)).to.be.equal(null);
    });
});
