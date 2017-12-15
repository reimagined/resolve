import 'regenerator-runtime/runtime';

import { expect } from 'chai';
import NeDB from 'nedb';
import sinon from 'sinon';

import buildProjection from '../src/build_projection';
import init from '../src/init';
import reset from '../src/reset';

describe('Read model MongoDB adapter', () => {
    const DEFAULT_COLLECTION_NAME = 'TestDefaultCollection';
    const DEFAULT_DOCUMENTS = [
        { id: 0, content: 'test-0', _id: 0 },
        { id: 1, content: 'test-1', _id: 1 },
        { id: 2, content: 'test-2', _id: 2 }
    ];

    const createDatabaseCollection = () => new NeDB({ autoload: true, inMemoryOnly: true });
    let testRepository;

    beforeEach(async () => {
        testRepository = { createDatabaseCollection };
    });

    afterEach(async () => {
        testRepository = null;
    });

    describe('Read-side interface created by adapter init function', () => {
        let readInstance;

        beforeEach(async () => {
            const defaultCollection = createDatabaseCollection();
            await new Promise((resolve, reject) =>
                defaultCollection.ensureIndex(
                    { fieldName: 'id' },
                    err => (!err ? resolve() : reject(err))
                )
            );
            for (let document of DEFAULT_DOCUMENTS) {
                await defaultCollection.insert(document);
            }

            readInstance = init(testRepository);

            testRepository.collectionMap.set(DEFAULT_COLLECTION_NAME, defaultCollection);
            testRepository.collectionIndexesMap.set(DEFAULT_COLLECTION_NAME, new Set(['id']));
        });

        afterEach(async () => {
            readInstance = null;
        });

        it('should provide last timestamp as zero value', async () => {
            const lastTimestamp = await readInstance.getLastAppliedTimestamp();
            expect(lastTimestamp).to.be.equal(0);
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

        it('should provide find + sort operation', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection.find({}).sort({ id: -1 });
            expect(result).to.be.deep.equal(DEFAULT_DOCUMENTS.slice().reverse());
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

        it('should provide find + sort + skip documents operation', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection
                .find({})
                .sort({ id: -1 })
                .skip(1);
            expect(result).to.be.deep.equal(
                DEFAULT_DOCUMENTS.slice()
                    .reverse()
                    .slice(1, 3)
            );
        });

        it('should provide find + sort + limit document operation', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection
                .find({})
                .sort({ id: -1 })
                .limit(2);
            expect(result).to.be.deep.equal(
                DEFAULT_DOCUMENTS.slice()
                    .reverse()
                    .slice(0, 2)
            );
        });

        it('should provide find + sort + skip + limit documents operation', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection
                .find({})
                .sort({ id: -1 })
                .skip(2)
                .limit(1);
            expect(result).to.be.deep.equal([DEFAULT_DOCUMENTS[0]]);
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

        it('should fail on find + sort operation with sort on non-indexed field', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.find({ id: 1 }).sort({ content: -1 });
                return Promise.reject('Sorting on non-indexes fields is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal('Sort by non-indexed fields is forbidden');
            }
        });

        it('should fail on find + sort operation with wrong sort index descriptor', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.find({ id: 1 }).sort();
                return Promise.reject('Sorting on non-indexes like descriptor is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal(
                    'Index descriptor should bee object with only one name key and 1/-1 sort value'
                );
            }
        });

        it('should fail on sort operation after cursor range operation', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection
                    .find({ id: 1 })
                    .skip(1)
                    .limit(1)
                    .sort({ id: -1 });
                return Promise.reject('Sorting after applying range operation is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal(
                    'Sorting can be specified only after find immediately'
                );
            }
        });

        it('should fail if find chain contains duplicate operations', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection
                    .find({ id: 1 })
                    .skip(1)
                    .skip(1);
                return Promise.reject('Applying duplicate operations in find chain is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal(
                    'Sorting can be specified only after find immediately'
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
        const FIELD_NAME = 'FieldName';
        let originalTestProjection;
        let builtTestProjection;
        let readInstance;

        beforeEach(async () => {
            originalTestProjection = {
                Init: sinon.stub(),
                TestEvent: sinon.stub(),

                EventCorrectEnsureIndex: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex({ [FIELD_NAME]: 1 });
                },

                EventWrongEnsureIndex: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex(FIELD_NAME);
                },

                EventCorrectRemoveIndex: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.removeIndex(FIELD_NAME);
                },

                EventWrongRemoveIndex: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.removeIndex({ [FIELD_NAME]: 1 });
                },

                EventCorrectInsert: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.insert({ [FIELD_NAME]: 'value' });
                },

                EventWrongInsert: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.insert({ [FIELD_NAME]: 'value' }, { option: 'value' });
                },

                EventCorrectFullUpdate: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex({ [FIELD_NAME]: 1 });
                    await collection.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await collection.update({ [FIELD_NAME]: 'value1' }, { [FIELD_NAME]: 'value2' });
                },

                EventCorrectPartialUpdate: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex({ [FIELD_NAME]: 1 });
                    await collection.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await collection.update(
                        { [FIELD_NAME]: 'value1' },
                        { $set: { [FIELD_NAME]: 'value2' } }
                    );
                },

                EventMalformedSearchUpdate: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await collection.update({ [FIELD_NAME]: 'value1' }, { [FIELD_NAME]: 'value2' });
                },

                EventMalformedMutationUpdate: async (store, event) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex({ [FIELD_NAME]: 1 });
                    await collection.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await collection.update(
                        { [FIELD_NAME]: 'value1' },
                        { $customOperator: { [FIELD_NAME]: 'value2' } }
                    );
                },

                EventWrongUpdate: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.update(
                        { [FIELD_NAME]: 'value1' },
                        { [FIELD_NAME]: 'value2' },
                        { option: 'value' }
                    );
                },

                EventCorrectRemove: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex({ [FIELD_NAME]: 1 });
                    await collection.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await collection.remove({ [FIELD_NAME]: 'value1' });
                },

                EventMalformedSearchRemove: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await collection.remove({ [FIELD_NAME]: 'value1' });
                },

                EventWrongRemove: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await collection.remove({ [FIELD_NAME]: 'value1' }, { option: 'value' });
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
            await readInstance.getReadable();
            expect(originalTestProjection.Init.callCount).to.be.equal(1);
        });

        it('should call Init projection function on read invocation only once', async () => {
            await readInstance.getReadable();
            await readInstance.getReadable();
            expect(originalTestProjection.Init.callCount).to.be.equal(1);
        });

        it('should call Init projection function on incoming event', async () => {
            await builtTestProjection.TestEvent({ type: 'TestEvent', timestamp: 10 });
            expect(originalTestProjection.Init.callCount).to.be.equal(1);
        });

        it('should call Init projection function on incoming event only once', async () => {
            await builtTestProjection.TestEvent({ type: 'TestEvent', timestamp: 10 });
            await builtTestProjection.TestEvent({ type: 'TestEvent', timestamp: 20 });
            expect(originalTestProjection.Init.callCount).to.be.equal(1);
        });

        it('should process corrent ensureIndex operation', async () => {
            expect(
                testRepository.collectionIndexesMap.get(DEFAULT_COLLECTION_NAME)
            ).to.be.deep.equal(undefined);

            await builtTestProjection.EventCorrectEnsureIndex({
                type: 'EventCorrectEnsureIndex',
                timestamp: 10
            });

            expect(
                Array.from(
                    testRepository.collectionIndexesMap.get(DEFAULT_COLLECTION_NAME).values()
                )
            ).to.be.deep.equal([FIELD_NAME]);
        });

        it('should throw error on wrong ensureIndex operation', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventWrongEnsureIndex({
                type: 'EventWrongEnsureIndex',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal(
                'Index descriptor should bee object with only one name key and 1/-1 sort value'
            );
        });

        it('should process corrent removeIndex operation', async () => {
            expect(
                testRepository.collectionIndexesMap.get(DEFAULT_COLLECTION_NAME)
            ).to.be.deep.equal(undefined);

            await builtTestProjection.EventCorrectRemoveIndex({
                type: 'EventCorrectRemoveIndex',
                timestamp: 10
            });

            expect(
                Array.from(
                    testRepository.collectionIndexesMap.get(DEFAULT_COLLECTION_NAME).values()
                )
            ).to.be.deep.equal([]);
        });

        it('should throw error on wrong removeIndex operation', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventWrongRemoveIndex({
                type: 'EventWrongRemoveIndex',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal(
                'Delete index operation accepts only string value'
            );
        });

        it('should process corrent insert operation', async () => {
            await builtTestProjection.EventCorrectInsert({
                type: 'EventCorrectInsert',
                timestamp: 10
            });

            const defaultCollection = testRepository.collectionMap.get(DEFAULT_COLLECTION_NAME);

            const findResult = await new Promise((resolve, reject) =>
                defaultCollection
                    .find({ [FIELD_NAME]: 'value' }, { _id: 0 })
                    .exec((err, docs) => (!err ? resolve(docs) : reject(err)))
            );

            expect(findResult).to.be.deep.equal([{ [FIELD_NAME]: 'value' }]);
        });

        it('should throw error on wrong insert operation', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventWrongInsert({
                type: 'EventWrongInsert',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal(
                'Additional options in modify operation insert are prohibited'
            );
        });

        it('should process corrent full update operation', async () => {
            await builtTestProjection.EventCorrectFullUpdate({
                type: 'EventCorrectFullUpdate',
                timestamp: 10
            });

            const defaultCollection = testRepository.collectionMap.get(DEFAULT_COLLECTION_NAME);

            const findResult = await new Promise((resolve, reject) =>
                defaultCollection
                    .find({ [FIELD_NAME]: 'value2' }, { _id: 0 })
                    .exec((err, docs) => (!err ? resolve(docs) : reject(err)))
            );

            expect(findResult).to.be.deep.equal([{ [FIELD_NAME]: 'value2' }]);
        });

        it('should process corrent partial set update operation', async () => {
            await builtTestProjection.EventCorrectPartialUpdate({
                type: 'EventCorrectPartialUpdate',
                timestamp: 10
            });

            const defaultCollection = testRepository.collectionMap.get(DEFAULT_COLLECTION_NAME);

            const findResult = await new Promise((resolve, reject) =>
                defaultCollection
                    .find({ [FIELD_NAME]: 'value2' }, { _id: 0 })
                    .exec((err, docs) => (!err ? resolve(docs) : reject(err)))
            );

            expect(findResult).to.be.deep.equal([{ [FIELD_NAME]: 'value2', content: 'content' }]);
        });

        it('should throw error on update operation with malformed search pattern', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventMalformedSearchUpdate({
                type: 'EventMalformedSearchUpdate',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal(
                'Operation update cannot be performed on non-indexed ' +
                    `field ${FIELD_NAME} in search pattern`
            );
        });

        it('should throw error on update operation with malformed update pattern', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventMalformedMutationUpdate({
                type: 'EventMalformedMutationUpdate',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.have.string(
                'Operation update contains forbidden patterns'
            );
            expect(lastError.message).to.have.string(
                'Update operator $customOperator is not permitted'
            );
        });

        it('should throw error on wrong update operation', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventWrongUpdate({
                type: 'EventWrongUpdate',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal(
                'Additional options in modify operation update are prohibited'
            );
        });

        it('should process corrent remove operation', async () => {
            await builtTestProjection.EventCorrectRemove({
                type: 'EventCorrectRemove',
                timestamp: 10
            });

            const defaultCollection = testRepository.collectionMap.get(DEFAULT_COLLECTION_NAME);

            const findResult = await new Promise((resolve, reject) =>
                defaultCollection.find({}).exec((err, docs) => (!err ? resolve(docs) : reject(err)))
            );

            expect(findResult).to.be.deep.equal([]);
        });

        it('should throw error on remove operation with malformed search pattern', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventMalformedSearchRemove({
                type: 'EventMalformedSearchRemove',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal(
                'Operation remove cannot be performed on non-indexed ' +
                    `field ${FIELD_NAME} in search pattern`
            );
        });

        it('should throw error on wrong remove operation', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventWrongRemove({
                type: 'EventWrongRemove',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal(
                'Additional options in modify operation remove are prohibited'
            );
        });
    });

    describe('Disposing adapter with reset function', () => {
        let readInstance;
        let defaultCollection;

        beforeEach(async () => {
            defaultCollection = createDatabaseCollection();
            await new Promise((resolve, reject) =>
                defaultCollection.ensureIndex(
                    { fieldName: 'id' },
                    err => (!err ? resolve() : reject(err))
                )
            );
            for (let document of DEFAULT_DOCUMENTS) {
                await defaultCollection.insert(document);
            }

            readInstance = init(testRepository);

            testRepository.collectionMap.set(DEFAULT_COLLECTION_NAME, defaultCollection);
            testRepository.collectionIndexesMap.set(DEFAULT_COLLECTION_NAME, new Set(['id']));

            await readInstance.getReadable();
        });

        afterEach(async () => {
            defaultCollection = null;
            readInstance = null;
        });

        it('should close connection and dispose target collections', async () => {
            const disposePromise = reset(testRepository);
            await disposePromise;

            const findResult = await new Promise((resolve, reject) =>
                defaultCollection
                    .find({})
                    .exec((err, value) => (!err ? resolve(value) : reject(err)))
            );

            expect(findResult).to.be.deep.equal([]);
        });

        it('should do nothing on second and following invocations', async () => {
            const firstDisposePromise = reset(testRepository);
            const secondDisposePromise = reset(testRepository);
            await firstDisposePromise;
            await secondDisposePromise;

            expect(firstDisposePromise).to.be.equal(secondDisposePromise);
        });
    });
});
