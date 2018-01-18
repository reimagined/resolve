import 'regenerator-runtime/runtime';

import { expect } from 'chai';
import NeDB from 'nedb';
import sinon from 'sinon';

import messages from '../src/messages';
import buildProjection from '../src/build_projection';
import init from '../src/init';
import reset from '../src/reset';

describe('Read model MongoDB adapter', () => {
    const DICTIONARY_TYPE = 'Dictionary';

    const DEFAULT_DICTIONARY_NAME = 'TestDefaultdictionary';
    const DEFAULT_ENTRIES = {
        id0: { content: 'test0' },
        id1: { content: 'test1' },
        id2: { content: 'test2' }
    };

    const createNedbdictionary = () => new NeDB({ autoload: true, inMemoryOnly: true });
    let testRepository;

    beforeEach(async () => {
        testRepository = { createNedbdictionary };
    });

    afterEach(async () => {
        testRepository = null;
    });

    describe.only('Read-side interface created by adapter init function', () => {
        let readInstance;

        beforeEach(async () => {
            const defaultdictionary = createNedbdictionary();
            await new Promise((resolve, reject) =>
                defaultdictionary.ensureIndex(
                    { fieldName: 'key' },
                    err => (!err ? resolve() : reject(err))
                )
            );

            for (let key of Object.keys(DEFAULT_ENTRIES)) {
                await new Promise((resolve, reject) =>
                    defaultdictionary.insert(
                        { key, payload: DEFAULT_ENTRIES[key] },
                        err => (!err ? resolve() : reject(err))
                    )
                );
            }

            readInstance = init(testRepository);

            testRepository.storagesMap.set(DEFAULT_DICTIONARY_NAME, {
                content: defaultdictionary,
                type: DICTIONARY_TYPE
            });
        });

        afterEach(async () => {
            readInstance = null;
        });

        it('should provide last timestamp as zero value', async () => {
            const lastTimestamp = await readInstance.getLastAppliedTimestamp();
            expect(lastTimestamp).to.be.equal(0);
        });

        it('should check storage existence', async () => {
            const readable = await readInstance.getReadable();

            const firstResult = await readable.exists(DEFAULT_DICTIONARY_NAME);
            const secondResult = await readable.exists('wrong');

            expect(firstResult).to.be.deep.equal(true);
            expect(secondResult).to.be.deep.equal(false);
        });

        it('should enumerate actual storages list', async () => {
            const readable = await readInstance.getReadable();
            const dictionarysList = await readable.list();

            expect(dictionarysList).to.be.deep.equal([
                {
                    name: DEFAULT_DICTIONARY_NAME,
                    type: DICTIONARY_TYPE
                }
            ]);
        });

        it('should throw error on non-existing storage access', async () => {
            const readable = await readInstance.getReadable();

            try {
                await readable.dictionary('wrong');
                return Promise.reject('Unexisting dictionary call should throw error on read side');
            } catch (err) {
                expect(err.message).to.be.equal(
                    messages.unexistingStorage(DICTIONARY_TYPE, 'wrong')
                );
            }
        });

        it('should throw error on storage drop attempt', async () => {
            const readable = await readInstance.getReadable();

            try {
                await readable.drop(DEFAULT_DICTIONARY_NAME);
                return Promise.reject('dictionary drop operation should fail on read-side');
            } catch (err) {
                expect(err.message).to.be.equal(
                    messages.readSideForbiddenOperation(null, 'drop', DEFAULT_DICTIONARY_NAME)
                );
            }
        });

        describe('Dictionary interface', () => {
            it('should provide dictionary exists operation', async () => {
                const readable = await readInstance.getReadable();
                const dictionary = await readable.dictionary(DEFAULT_DICTIONARY_NAME);

                const firstResult = await dictionary.exists('id0');
                const secondResult = await dictionary.exists('id4');

                expect(firstResult).to.be.deep.equal(true);
                expect(secondResult).to.be.deep.equal(false);
            });

            it('should provide dictionary get operation', async () => {
                const readable = await readInstance.getReadable();
                const dictionary = await readable.dictionary(DEFAULT_DICTIONARY_NAME);

                const firstResult = await dictionary.get('id0');
                const secondResult = await dictionary.get('id4');

                expect(firstResult).to.be.deep.equal({ content: 'test0' });
                expect(secondResult).to.be.deep.equal(null);
            });

            it('should throw error on dictionary create attempt', async () => {
                const readable = await readInstance.getReadable();

                try {
                    await readable.createDictionary('NewDictionary');
                    return Promise.reject('dictionary create operation should fail on read-side');
                } catch (err) {
                    expect(err.message).to.be.equal(
                        messages.readSideForbiddenOperation(
                            DICTIONARY_TYPE,
                            'create',
                            'NewDictionary'
                        )
                    );
                }
            });

            it('should throw error on dictionary set operation attempt', async () => {
                const readable = await readInstance.getReadable();
                const dictionary = await readable.dictionary(DEFAULT_DICTIONARY_NAME);

                try {
                    await dictionary.set('id4', { content: 'test-4' });
                    return Promise.reject('dictionary set operation should fail on read-side');
                } catch (err) {
                    expect(err.message).to.be.equal(
                        messages.readSideForbiddenOperation(
                            DICTIONARY_TYPE,
                            'set',
                            DEFAULT_DICTIONARY_NAME
                        )
                    );
                }
            });

            it('should throw error on dictionary del operation attempt', async () => {
                const readable = await readInstance.getReadable();
                const dictionary = await readable.dictionary(DEFAULT_DICTIONARY_NAME);

                try {
                    await dictionary.del('id3');
                    return Promise.reject('dictionary del operation should fail on read-side');
                } catch (err) {
                    expect(err.message).to.be.equal(
                        messages.readSideForbiddenOperation(
                            DICTIONARY_TYPE,
                            'del',
                            DEFAULT_DICTIONARY_NAME
                        )
                    );
                }
            });
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
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.ensureIndex({ fieldName: FIELD_NAME, fieldType: 'string' });
                    await dictionary.ensureIndex({ fieldName: FIELD_NAME, fieldType: 'string' });
                },

                EventMalformedDescriptorEnsureIndex: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.ensureIndex({ fieldName: FIELD_NAME, fieldType: 'wrong' });
                },

                EventWrongEnsureIndex: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.ensureIndex(FIELD_NAME);
                },

                EventCorrectRemoveIndex: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.ensureIndex({ fieldName: FIELD_NAME, fieldType: 'string' });
                    await dictionary.removeIndex(FIELD_NAME);
                    await dictionary.removeIndex(FIELD_NAME);
                },

                EventWrongRemoveIndex: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.removeIndex({ [FIELD_NAME]: 1 });
                },

                EventCorrectInsert: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.insert({ [FIELD_NAME]: 'value' });
                },

                EventWrongInsert: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.insert({ [FIELD_NAME]: 'value' }, { option: 'value' });
                },

                EventCorrectFullUpdate: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.ensureIndex({ fieldName: FIELD_NAME, fieldType: 'string' });
                    await dictionary.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await dictionary.update({ [FIELD_NAME]: 'value1' }, { [FIELD_NAME]: 'value2' });
                },

                EventCorrectPartialUpdate: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.ensureIndex({ fieldName: FIELD_NAME, fieldType: 'string' });
                    await dictionary.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await dictionary.update(
                        { [FIELD_NAME]: 'value1' },
                        { $set: { [FIELD_NAME]: 'value2' } }
                    );
                },

                EventMalformedSearchUpdate: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await dictionary.update({ [FIELD_NAME]: 'value1' }, { [FIELD_NAME]: 'value2' });
                },

                EventMalformedMutationUpdate: async (store, event) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.ensureIndex({ fieldName: FIELD_NAME, fieldType: 'string' });
                    await dictionary.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await dictionary.update(
                        { [FIELD_NAME]: 'value1' },
                        { $customOperator: { [FIELD_NAME]: 'value2' } }
                    );
                },

                EventScalarMutationUpdate: async (store, event) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.ensureIndex({ fieldName: FIELD_NAME, fieldType: 'string' });
                    await dictionary.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await dictionary.update({ [FIELD_NAME]: 'value1' }, 'scalar');
                },

                EventWrongUpdate: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.update(
                        { [FIELD_NAME]: 'value1' },
                        { [FIELD_NAME]: 'value2' },
                        { option: 'value' }
                    );
                },

                EventCorrectRemove: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.ensureIndex({ fieldName: FIELD_NAME, fieldType: 'string' });
                    await dictionary.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await dictionary.remove({ [FIELD_NAME]: 'value1' });
                },

                EventMalformedSearchRemove: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await dictionary.remove({ [FIELD_NAME]: 'value1' });
                },

                EventWrongRemove: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.insert({ [FIELD_NAME]: 'value1', content: 'content' });
                    await dictionary.remove({ [FIELD_NAME]: 'value1' }, { option: 'value' });
                },

                EventCheckEqualdictionarys: async (store) => {
                    const dictionaryFirst = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    const dictionarySecond = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    if (dictionaryFirst === dictionarySecond) {
                        throw new Error('dictionarys is equal');
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

        it('should reuse dictionary interfaces which already initialized', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventCheckEqualdictionarys({
                type: 'EventCheckEqualdictionarys',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal('dictionarys is equal');
        });

        it('should process corrent ensureIndex operation', async () => {
            expect(
                testRepository.dictionaryIndexesMap.get(DEFAULT_DICTIONARY_NAME)
            ).to.be.deep.equal(undefined);

            await builtTestProjection.EventCorrectEnsureIndex({
                type: 'EventCorrectEnsureIndex',
                timestamp: 10
            });

            expect(
                Array.from(
                    testRepository.dictionaryIndexesMap.get(DEFAULT_DICTIONARY_NAME).values()
                )
            ).to.be.deep.equal([FIELD_NAME]);
        });

        it('should throw error on ensureIndex operation with malformed index object', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventMalformedDescriptorEnsureIndex({
                type: 'EventMalformedDescriptorEnsureIndex',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal(messages.indexDescriptorWriteShape);
        });

        it('should throw error on wrong ensureIndex operation', async () => {
            let lastError = await readInstance.getError();
            expect(lastError).to.be.equal(null);

            await builtTestProjection.EventWrongEnsureIndex({
                type: 'EventWrongEnsureIndex',
                timestamp: 10
            });

            lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal(messages.indexDescriptorWriteShape);
        });

        it('should process corrent removeIndex operation', async () => {
            expect(
                testRepository.dictionaryIndexesMap.get(DEFAULT_DICTIONARY_NAME)
            ).to.be.deep.equal(undefined);

            await builtTestProjection.EventCorrectRemoveIndex({
                type: 'EventCorrectRemoveIndex',
                timestamp: 10
            });

            expect(
                Array.from(
                    testRepository.dictionaryIndexesMap.get(DEFAULT_DICTIONARY_NAME).values()
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

            const defaultdictionary = testRepository.dictionaryMap.get(DEFAULT_DICTIONARY_NAME);

            const findResult = await new Promise((resolve, reject) =>
                defaultdictionary
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

            const defaultdictionary = testRepository.dictionaryMap.get(DEFAULT_DICTIONARY_NAME);

            const findResult = await new Promise((resolve, reject) =>
                defaultdictionary
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

            const defaultdictionary = testRepository.dictionaryMap.get(DEFAULT_DICTIONARY_NAME);

            const findResult = await new Promise((resolve, reject) =>
                defaultdictionary
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

            const defaultdictionary = testRepository.dictionaryMap.get(DEFAULT_DICTIONARY_NAME);

            const findResult = await new Promise((resolve, reject) =>
                defaultdictionary.find({}).exec((err, docs) => (!err ? resolve(docs) : reject(err)))
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
        let defaultdictionary;

        beforeEach(async () => {
            defaultdictionary = createDatabasedictionary();
            await new Promise((resolve, reject) =>
                defaultdictionary.ensureIndex(
                    { fieldName: 'id' },
                    err => (!err ? resolve() : reject(err))
                )
            );
            for (let document of DEFAULT_ENTRIES) {
                await defaultdictionary.insert(document);
            }

            readInstance = init(testRepository);

            testRepository.dictionaryMap.set(DEFAULT_DICTIONARY_NAME, defaultdictionary);
            testRepository.dictionaryIndexesMap.set(DEFAULT_DICTIONARY_NAME, new Set(['id']));

            await readInstance.getReadable();
        });

        afterEach(async () => {
            defaultdictionary = null;
            readInstance = null;
        });

        it('should close connection and dispose target dictionarys', async () => {
            const disposePromise = reset(testRepository);
            await disposePromise;

            const findResult = await new Promise((resolve, reject) =>
                defaultdictionary
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
