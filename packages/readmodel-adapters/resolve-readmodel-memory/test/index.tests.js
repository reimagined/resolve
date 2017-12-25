import 'regenerator-runtime/runtime';

import { expect } from 'chai';
import NeDB from 'nedb';
import sinon from 'sinon';

import messages from '../src/messages';
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
                expect(err.message).to.be.equal(messages.unexistingCollection('wrong'));
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
                expect(err.message).to.be.deep.equal(messages.searchOnlyIndexedFields);
            }
        });

        it('should fail on find operation with search query operators', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.find({ id: { $gt: 1 } });
                return Promise.reject('Search with query operators is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal(messages.searchExpressionValuesOnlyPrimitive);
            }
        });

        it('should fail on find operation with empty or non-object query', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.find();
                return Promise.reject('Search with non-object match is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal(messages.searchExpressionOnlyObject);
            }
        });

        it('should fail on find + sort operation with sort on non-indexed field', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.find({ id: 1 }).sort({ content: -1 });
                return Promise.reject('Sorting on non-indexes fields is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal(messages.sortOnlyIndexedFields);
            }
        });

        it('should fail on find + sort operation with wrong sort index descriptor', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.find({ id: 1 }).sort();
                return Promise.reject('Sorting on non-indexes like descriptor is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal(messages.indexDescriptorShape);
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
                expect(err.message).to.be.deep.equal(messages.sortOnlyAfterFind);
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
                expect(err.message).to.be.deep.equal(messages.dublicateOperation('skip'));
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
                expect(err.message).to.be.deep.equal(messages.findOperationNoReuse);
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

        it('should fail on count operation with empty or non-object query', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.count();
                return Promise.reject('Count on empty or non-object query is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal(messages.searchExpressionOnlyObject);
            }
        });

        it('should support then-only branch on correct read query', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection.find({ id: 2 }).then(result => result);
            expect(result[0].content).to.be.equal('test-2');
        });

        it('should support catch-only branch failure on raised readable error', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const err = await collection.find('wrong-find').catch(err => err);
            expect(err.message).to.be.deep.equal(messages.searchExpressionOnlyObject);
        });

        it('should fail on count operation with search on non-indexed field', async () => {
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.count({ content: 'test-1' });
                return Promise.reject('Count on non-indexes fields is forbidden');
            } catch (err) {
                expect(err.message).to.be.deep.equal(messages.searchOnlyIndexedFields);
            }
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
                    messages.readSideForbiddenOperation('ensureIndex', DEFAULT_COLLECTION_NAME)
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
                    messages.readSideForbiddenOperation('removeIndex', DEFAULT_COLLECTION_NAME)
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
                    messages.readSideForbiddenOperation('insert', DEFAULT_COLLECTION_NAME)
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
                    messages.readSideForbiddenOperation('update', DEFAULT_COLLECTION_NAME)
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
                    messages.readSideForbiddenOperation('remove', DEFAULT_COLLECTION_NAME)
                );
            }
        });
    });

    describe('Write-side interface created by adapter buildProjection function', () => {
        const FIELD_NAME = 'FieldName';
        let originalTestProjection;
        let builtTestProjection;
        let readInstance;
        let initShouldFail;

        beforeEach(async () => {
            initShouldFail = false;

            originalTestProjection = {
                Init: sinon.stub().callsFake(async () => {
                    await new Promise((resolve, reject) =>
                        setImmediate(
                            () => (!initShouldFail ? resolve() : reject(new Error('Init Failure')))
                        )
                    );
                }),

                TestEvent: sinon.stub(),

                EventCorrectEnsureIndex: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex({ [FIELD_NAME]: 1 });
                    await collection.ensureIndex({ [FIELD_NAME]: 1 });
                },

                EventWrongEnsureIndex: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex(FIELD_NAME);
                },

                EventCorrectRemoveIndex: async (store) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex({ [FIELD_NAME]: 1 });
                    await collection.removeIndex(FIELD_NAME);
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

                EventScalarMutationUpdate: async (store, event) => {
                    const collection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await collection.ensureIndex({ [FIELD_NAME]: 1 });
                    await collection.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await collection.update({ [FIELD_NAME]: 'value1' }, 'scalar');
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
                },

                EventCheckEqualCollections: async (store) => {
                    const collectionFirst = await store.collection(DEFAULT_COLLECTION_NAME);
                    const collectionSecond = await store.collection(DEFAULT_COLLECTION_NAME);
                    if (collectionFirst === collectionSecond) {
                        throw new Error('Collections is equal');
                    }
                }
            };

            builtTestProjection = buildProjection(testRepository, originalTestProjection);
            readInstance = init(testRepository);
        });

        afterEach(async () => {
            originalTestProjection = null;
            builtTestProjection = null;
            initShouldFail = null;
            readInstance = null;
        });

        it('should raise error on read interface reinitialization', async () => {
            try {
                readInstance = init(testRepository);
                return Promise.reject('Read instance can\'t be initialized twice');
            } catch (err) {
                expect(err.message).to.be.equal(messages.reinitialization);
            }
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

        it('should handle errors in Init projection function', async () => {
            initShouldFail = true;
            const initError = await readInstance.getError();
            expect(originalTestProjection.Init.callCount).to.be.equal(1);
            expect(initError.message).to.be.equal('Init Failure');
        });

        it('should reuse collection interfaces which already initialized', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventCheckEqualCollections({
                type: 'EventCheckEqualCollections',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal('Collections is equal');
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
            expect(lastError.message).to.be.equal(messages.indexDescriptorShape);
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
            expect(lastError.message).to.be.equal(messages.deleteIndexArgumentShape);
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
            expect(lastError.message).to.be.equal(messages.mofidyOperationNoOptions('insert'));
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
                messages.mofidyOperationOnlyIndexedFiels('update', FIELD_NAME)
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
            expect(lastError.message).to.be.equal(
                messages.modifyOperationForbiddenPattern('update', [
                    messages.updateOperatorFixedSet('$customOperator')
                ])
            );
        });

        it('should throw error on update operation with scalar update field', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventScalarMutationUpdate({
                type: 'EventScalarMutationUpdate',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal(
                messages.modifyOperationForbiddenPattern('update', [
                    messages.updateExpressionOnlyObject
                ])
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
            expect(lastError.message).to.be.equal(messages.mofidyOperationNoOptions('update'));
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
                messages.mofidyOperationOnlyIndexedFiels('remove', FIELD_NAME)
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
            expect(lastError.message).to.be.equal(messages.mofidyOperationNoOptions('remove'));
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
