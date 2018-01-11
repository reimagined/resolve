import { expect } from 'chai';
import redis from 'redis-mock';

import createRedisAdapter from '../src/index';
import nativeRedisAdapter from '../src/adapter';
import metaCollection from '../src/metaCollection';

const safeParse = (str) => {
    try {
        return JSON.parse(str);
    } catch (e) {
        return str;
    }
};

const invokeCommand = (client, command, name, ...args) =>
    new Promise((resolve, reject) => {
        const params = [
            name,
            ...args,
            (err, data) => {
                if (err) {
                    return reject(err);
                }
                return resolve(Array.isArray(data) ? data.map(safeParse) : safeParse(data));
            }
        ];
        client[command](...params);
    });

describe('Read model redis adapter', () => {
    let adapter, getReadable;

    let repository = {
        metaCollectionName: 'meta',
        autoincMetaCollectionName: 'meta_autoinc',
        client: redis.createClient()
    };
    repository.metaCollection = metaCollection(repository);

    repository.client['ZINTERSTORE'] = async function () {
        const destination = arguments[0];
        const numkeys = arguments[1];
        const cb = arguments[arguments.length - 1];
        const firstKeyIndex = 2;
        const lastKeyIndex = firstKeyIndex + numkeys;

        const rangePromises = Object.values(arguments)
            .slice(firstKeyIndex, lastKeyIndex)
            .map(
                async collectionName =>
                    await invokeCommand(repository.client, 'ZRANGE', collectionName, 0, -1)
            );

        const values = await Promise.all(rangePromises);
        let result = values[0];

        for (let i = 1; i < values.length; i++) {
            result = result.filter(n => values[i].includes(n));
        }

        const addPromises = result.map(
            async (id, index) =>
                await invokeCommand(repository.client, 'ZADD', destination, index, id)
        );

        await Promise.all(addPromises);
        cb(null, result);
    };

    const del = repository.client.del;
    repository.client['DEL'] = function () {
        const args = Object.values(arguments);
        const cbIndex = arguments.length - 1;
        const cb = args[cbIndex];
        const keys = args.slice(0, cbIndex);
        del(keys, cb);
    };

    let nativeAdapter = nativeRedisAdapter(repository);

    beforeEach(async () => {
        repository.client.flushall((e) => {
            if (e) {
                // eslint-disable-next-line no-console
                console.log(e);
            }
        });

        await nativeAdapter.createCollection('Test');

        adapter = createRedisAdapter(
            {},
            repository.metaCollectionName,
            repository.autoincMetaCollectionName,
            repository.client
        );

        adapter.buildProjection({
            Init: async (store) => {
                try {
                    const TestCollection = await store.collection('Test');
                    await TestCollection.ensureIndex({ fieldName: 'i', fieldType: 'number' });
                    await TestCollection.ensureIndex({ fieldName: 's', fieldType: 'string' });

                    await TestCollection.insert({ i: 100, s: 'aaa', text: 'Initial' });
                    await TestCollection.insert({ i: 200, s: 'bbb', text: 'First text' });
                    await TestCollection.insert({ i: 100, s: 'bbb', text: 'Second text' });
                    await TestCollection.insert({ i: 100, s: 'bbb', text: 'Last text' });
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.log(`error: ${error}`);
                }
            },
            TestEvent: async (store, event) => {
                if (event.crashFlag) {
                    throw new Error('Test crashing event');
                }
                const TestCollection = await store.collection('Test');

                await TestCollection.insert({
                    text: event.text
                });
            }
        });

        const readSide = adapter.init();
        getReadable = readSide.getReadable;

        await getReadable();
    });

    afterEach(() => {});

    it('should have apropriate API', () => {
        expect(adapter.buildProjection).to.be.a('function');
        expect(adapter.init).to.be.a('function');
        expect(adapter.reset).to.be.a('function');
    });

    it('sort asc', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection('Test');

        const records = await TestCollection.find({}).sort({ _id: 1 });

        expect(records.length).to.be.equal(4);
        expect(records[0]._id).to.be.equal(1);
        expect(records[3]._id).to.be.equal(4);
    });

    it('sort desc', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection('Test');

        const records = await TestCollection.find({}).sort({ _id: -1 });

        expect(records.length).to.be.equal(4);
        expect(records[0]._id).to.be.equal(4);
        expect(records[3]._id).to.be.equal(1);
    });

    it('find', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection('Test');

        const records = await TestCollection.find({});

        expect(records.length).to.be.equal(4);
    });

    it('find 2', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection('Test');

        const records = await TestCollection.find();

        expect(records.length).to.be.equal(4);
    });

    it('find by id', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection('Test');

        const records = await TestCollection.find({ _id: 1 });

        expect(records[0].text).to.be.equal('Initial');
        expect(records[0]._id).to.be.equal(1);
    });
});
