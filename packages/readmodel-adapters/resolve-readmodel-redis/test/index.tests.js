import { expect } from 'chai';
import redis from 'redis';

import createRedisAdapter from '../src/index';
import nativeRedisAdapter from '../src/adapter';
import metaCollection from '../src/metaCollection';

describe('Read model redis adapter', () => {
    let repository, adapter, nativeAdapter, getReadable;

    beforeEach(async () => {
        repository = {
            metaCollectionName: 'meta',
            autoincMetaCollectionName: 'meta_autoinc'
        };
        repository.client = redis.createClient();
        repository.metaCollection = metaCollection(repository);
        nativeAdapter = nativeRedisAdapter(repository);

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
            repository.autoincMetaCollectionName
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

                    await TestCollection.update({ i: 100, s: 'aaa' }, { $unset: { text: '' } });
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

    // it('should have apropriate API', () => {
    //     expect(adapter.buildProjection).to.be.a('function');
    //     expect(adapter.init).to.be.a('function');
    //     expect(adapter.reset).to.be.a('function');
    // });

    it('find by id', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection('Test');

        const records = await TestCollection.find({ _id: 1 }) /*.sort({ id: 1 })*/;

        expect(records[0].text).to.be.equal('Initial');
        expect(records[0]._id).to.be.equal(1);
    });
});
