import { expect } from 'chai';
import redis from 'redis';

import createRedisAdapter from '../src/index';
import nativeRedisAdapter from '../src/adapter';
import metaCollection from '../src/metaCollection';

describe('Read model redis adapter', () => {
    let repository, projection, adapter, nativeAdapter, getReadable, getError;

    beforeEach(async () => {
        repository = {
            metaCollectionName: 'meta',
            autoincMetaCollectionName: 'meta_autoinc'
        };
        repository.client = redis.createClient();
        repository.metaCollection = metaCollection(repository);
        nativeAdapter = nativeRedisAdapter(repository);

        repository.client.flushall((e) => {
            if(e) {
                console.log(e)
            }
        });

        await nativeAdapter.createCollection('Test');

        adapter = createRedisAdapter(
            {},
            repository.metaCollectionName,
            repository.autoincMetaCollectionName
        );

        projection = adapter.buildProjection({
            Init: async (store) => {
                try {
                    const TestCollection = await store.collection('Test');
                    // await TestCollection.ensureIndex({ fieldName: 'id' });
                    await TestCollection.insert({ text: 'Initial' });
                    await TestCollection.insert({ text: 'First text' });
                    await TestCollection.insert({ text: 'Second text' });
                } catch (error) {
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
        getError = readSide.getError;

        await getReadable();
    });

    afterEach(() => {});

    it('should have apropriate API', () => {
        expect(adapter.buildProjection).to.be.a('function');
        expect(adapter.init).to.be.a('function');
        expect(adapter.reset).to.be.a('function');
    });

    it('find by id', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection('Test');

        const records = await TestCollection.find({ _id: 1 }) /*.sort({ id: 1 })*/;

        expect(records[0].text).to.be.equal('Initial');
        expect(records[0]._id).to.be.equal(1);
    });
});
