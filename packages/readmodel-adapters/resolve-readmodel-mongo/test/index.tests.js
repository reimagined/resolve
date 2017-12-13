import 'regenerator-runtime/runtime';

import { expect } from 'chai';
import mongoUnit from 'mongo-unit';
import { MongoClient } from 'mongodb';
import sinon from 'sinon';

import buildProjection from '../src/build_projection';
import init from '../src/init';
import reset from '../src/reset';

describe('Read model MongoDB adapter', () => {
    const DEFAULT_COLLECTION_NAME = 'TestDefaultCollection';
    const META_COLLECTION_NAME = 'TestMetaCollection';

    let testConnection;
    let testRepository;

    before(async function () {
        this.timeout(0);
        const connectionUrl = await mongoUnit.start({ dbName: 'admin' });
        testConnection = await MongoClient.connect(connectionUrl);
    });

    after(async () => {
        await testConnection.dropDatabase();
        testConnection.command({ shutdown: 1 });
        await testConnection.close();
        testConnection = null;
    });

    beforeEach(async () => {
        testRepository = {
            connectDatabase: async () => testConnection,
            metaCollectionName: META_COLLECTION_NAME
        };
    });

    afterEach(async () => {
        for (let { name } of await testConnection.listCollections({}).toArray()) {
            if (name.indexOf('system.') > -1) continue;
            const collection = await testConnection.collection(name);
            await collection.drop();
        }

        testRepository = null;
    });

    describe('Read-side interface created by adapter init function', () => {
        const DEFAULT_DOCUMENTS = [
            { id: 0, content: 'test-0' },
            { id: 1, content: 'test-1' },
            { id: 2, content: 'test-2' }
        ];

        let readInstance;

        beforeEach(async () => {
            const defaultCollection = await testConnection.collection(DEFAULT_COLLECTION_NAME);
            for (let document of DEFAULT_DOCUMENTS) {
                await defaultCollection.insert(document);
            }

            const metaCollection = await testConnection.collection(META_COLLECTION_NAME);
            await metaCollection.insert({
                collectionName: DEFAULT_COLLECTION_NAME,
                lastTimestamp: 30,
                indexes: ['id']
            });

            readInstance = init(testRepository);
        });

        afterEach(async () => {
            readInstance = null;
        });

        it('should provide last timestamp value for snapshots', async () => {
            const lastTimestamp = await readInstance.getLastAppliedTimestamp();
            expect(lastTimestamp).to.be.equal(30);
        });

        it('should throw error on non-existing collection access', async () => {
            const readable = await readInstance.getReadable();

            try {
                await readable.collection('wrong');
                return Promise.reject('Unexisting collection call should throw error on read side');
            } catch (err) {
                expect(err.message).to.be.equal('Collection wrong does not exist');
            }
        });

        it('should provide simple find operation', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection.find({});
            expect(result).to.be.deep.equal(DEFAULT_DOCUMENTS);
        });

        it('should provide find + search condition operation', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection.find({ id: 1 });
            expect(result).to.be.deep.equal([DEFAULT_DOCUMENTS[1]]);
        });

        it('should provide find + skip documents operation', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection.find({}).skip(1);
            expect(result).to.be.deep.equal(DEFAULT_DOCUMENTS.slice(1, 3));
        });

        it('should provide find + limit document operation', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection.find({}).limit(2);
            expect(result).to.be.deep.equal(DEFAULT_DOCUMENTS.slice(0, 2));
        });

        it('should provide find + skip + limit documents operation', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection
                .find({})
                .skip(2)
                .limit(1);
            expect(result).to.be.deep.equal([DEFAULT_DOCUMENTS[2]]);
        });

        it('should fail on find operation with search on non-indexed field', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.find({ content: 'test-1' });
                return Promise.reject('Search on non-indexes fields is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal('Search on non-indexed fields is forbidden');
            }
        });

        it('should fail on find operation with search query operators', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.find({ id: { $gt: 1 } });
                return Promise.reject('Search with query operators is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal(
                    'Search expression values should be either number or string ' +
                        'and should not contain query operator'
                );
            }
        });

        it('should fail on find operation with empty or non-object query', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.find();
                return Promise.reject('Search with non-object match is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal(
                    'Search expression should be object with fields and search values'
                );
            }
        });

        it('should fail on find operation reuse attempt', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const resultPromise = collection.find({});
            await resultPromise;
            try {
                await resultPromise;
                return Promise.reject('Search operator resource re-using is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal(
                    'After documents are retrieved with a search request, ' +
                        'this search request cannot be reused'
                );
            }
        });

        it('should provide findOne operation for first matched document', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection.findOne({ id: 2 });
            expect(result).to.be.deep.equal(DEFAULT_DOCUMENTS[2]);
        });

        it('should provide findOne which return null when no match', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection.findOne({ id: 3 });
            expect(result).to.be.deep.equal(null);
        });

        it('should provide count operation for count matched documents quantity', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection.count({ id: 2 });
            expect(result).to.be.deep.equal(1);
        });

        it('should provide actual collections list in storage', async () => {
            const readable = await readInstance.getReadable();
            const collectionsList = await readable.listCollections();

            expect(collectionsList).to.be.deep.equal([DEFAULT_COLLECTION_NAME]);
        });

        it('should throw error on collection create index attempt', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.ensureIndex({ test: 1 });
                return Promise.reject('Collection ensureIndex operation should fail on read-side');
            } catch (err) {
                expect(err.message).to.be.equal(
                    `The ${DEFAULT_COLLECTION_NAME} collection’s ensureIndex method ` +
                        'is not allowed on the read side'
                );
            }
        });

        it('should throw error on collection remove index attempt', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.removeIndex('test');
                return Promise.reject('Collection removeIndex operation should fail on read-side');
            } catch (err) {
                expect(err.message).to.be.equal(
                    `The ${DEFAULT_COLLECTION_NAME} collection’s removeIndex method ` +
                        'is not allowed on the read side'
                );
            }
        });

        it('should throw error on collection document insert attempt ', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.insert({ test: 0 });
                return Promise.reject('Collection insert operation should fail on read-side');
            } catch (err) {
                expect(err.message).to.be.equal(
                    `The ${DEFAULT_COLLECTION_NAME} collection’s insert method ` +
                        'is not allowed on the read side'
                );
            }
        });

        it('should throw error on collection document update attempt', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.update({ test: 0 }, { test: 1 });
                return Promise.reject('Collection update operation should fail on read-side');
            } catch (err) {
                expect(err.message).to.be.equal(
                    `The ${DEFAULT_COLLECTION_NAME} collection’s update method ` +
                        'is not allowed on the read side'
                );
            }
        });

        it('should throw error on collection document remove attempt ', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.remove({ test: 0 });
                return Promise.reject('Collection remove operation should fail on read-side');
            } catch (err) {
                expect(err.message).to.be.equal(
                    `The ${DEFAULT_COLLECTION_NAME} collection’s remove method ` +
                        'is not allowed on the read side'
                );
            }
        });
    });

    describe('Write-side interface created by adapter buildProjection function', () => {
        let originalTestProjection;
        let builtTestProjection;
        let readInstance;

        beforeEach(async () => {
            originalTestProjection = {
                Init: sinon.stub(),
                TestEvent: sinon.stub(),

                EventCorrectEnsureIndex: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex({ fieldName: 1 });
                },

                EventWrongEnsureIndex: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex('fieldName');
                },

                EventCorrectRemoveIndex: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.removeIndex('fieldName');
                },

                EventWrongRemoveIndex: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.removeIndex({ fieldName: 1 });
                },

                EventCorrectInsert: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.insert({ fieldName: 'value' });
                },

                EventWrongInsert: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.insert({ fieldName: 'value' }, { option: 'value' });
                },

                EventCorrectFullUpdate: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex({ fieldName: 1 });
                    await collection.insert({ fieldName: 'value1', content: 'content' });
                    await collection.update({ fieldName: 'value1' }, { fieldName: 'value2' });
                },

                EventCorrectPartialUpdate: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex({ fieldName: 1 });
                    await collection.insert({ fieldName: 'value1', content: 'content' });
                    await collection.update(
                        { fieldName: 'value1' },
                        { $set: { fieldName: 'value2' } }
                    );
                },

                EventMalformedSearchUpdate: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.insert({ fieldName: 'value1', content: 'content' });
                    await collection.update({ fieldName: 'value1' }, { fieldName: 'value2' });
                },

                EventMalformedMutationUpdate: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex({ fieldName: 1 });
                    await collection.insert({ fieldName: 'value1', content: 'content' });
                    await collection.update({ fieldName: 'value1' }, { fieldName: 'value2' });
                },

                EventWrongUpdate: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.update(
                        { fieldName: 'value1' },
                        { fieldName: 'value2' },
                        { option: 'value' }
                    );
                },

                EventCorrectRemove: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex({ fieldName: 1 });
                    await collection.insert({ fieldName: 'value1', content: 'content' });
                    await collection.remove({ fieldName: 'value1' });
                },

                EventMalformedSearchRemove: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.insert({ fieldName: 'value1', content: 'content' });
                    await collection.remove({ fieldName: 'value1' });
                },

                EventWrongRemove: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.insert({ fieldName: 'value1', content: 'content' });
                    await collection.remove({ fieldName: 'value1' }, { option: 'value' });
                }
            };

            builtTestProjection = buildProjection(testRepository, originalTestProjection);
            readInstance = init(testRepository);
        });

        afterEach(async () => {
            originalTestProjection = null;
            builtTestProjection = null;
            readInstance = null;
        });

        it('should call Init projection function on read invocation', async () => {
            expect(originalTestProjection.Init.callCount).to.be.equal(0);
            await readInstance.getReadable();
            expect(originalTestProjection.Init.callCount).to.be.equal(1);
        });

        it('should call Init projection function on read invocation only once', async () => {
            expect(originalTestProjection.Init.callCount).to.be.equal(0);

            await readInstance.getReadable();
            await readInstance.getReadable();

            expect(originalTestProjection.Init.callCount).to.be.equal(1);
        });

        it('should call Init projection function on incoming event', async () => {
            expect(originalTestProjection.Init.callCount).to.be.equal(0);

            await builtTestProjection.TestEvent({
                type: 'TestEvent',
                timestamp: 10
            });

            expect(originalTestProjection.Init.callCount).to.be.equal(1);
        });

        it('should call Init projection function on incoming event only once', async () => {
            expect(originalTestProjection.Init.callCount).to.be.equal(0);

            await builtTestProjection.TestEvent({
                type: 'TestEvent',
                timestamp: 10
            });
            await builtTestProjection.TestEvent({
                type: 'TestEvent',
                timestamp: 20
            });

            expect(originalTestProjection.Init.callCount).to.be.equal(1);
        });

        it('should process corrent ensureIndex operation', async () => {
            const defaultCollection = await testConnection.collection(DEFAULT_COLLECTION_NAME);
            const metaCollection = await testConnection.collection(META_COLLECTION_NAME);

            expect(await defaultCollection.count({})).to.be.equal(0);
            expect(
                await metaCollection.findOne({ collectionName: DEFAULT_COLLECTION_NAME })
            ).to.be.equal(null);

            await builtTestProjection.EventCorrectEnsureIndex({
                type: 'EventCorrectEnsureIndex',
                timestamp: 10
            });

            expect(await defaultCollection.count({})).to.be.equal(0);
            const metaDescriptor = await metaCollection.findOne({
                collectionName: DEFAULT_COLLECTION_NAME
            });
            expect(metaDescriptor.lastTimestamp).to.be.equal(10);
            expect(metaDescriptor.indexes).to.be.deep.equal(['fieldName']);
        });

        it('should process throw error on wrong ensureIndex operation', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventWrongEnsureIndex({
                type: 'EventWrongEnsureIndex',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal(
                'Ensure index operation accepts only object with one key and 1/-1 value'
            );
        });
    });

    describe('Reset function', () => {});
});
