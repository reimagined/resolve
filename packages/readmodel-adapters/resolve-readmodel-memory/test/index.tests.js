import 'regenerator-runtime/runtime';

import { expect } from 'chai';
import sinon from 'sinon';

import messages from '../src/messages';
import buildProjection from '../src/build_projection';
import init from '../src/init';
import reset from '../src/reset';

describe('Read model MongoDB adapter', () => {
    const DICTIONARY_TYPE = 'Dictionary';

    const DEFAULT_DICTIONARY_NAME = 'TestdefaultDictionaryStorage';
    const DEFAULT_ENTRIES = {
        id0: { content: 'test0' },
        id1: { content: 'test1' },
        id2: { content: 'test2' }
    };

    const constructStorage = async (type) => {
        switch (type) {
            case 'Dictionary':
                return new Map();
            default:
                throw new Error('Wrong type');
        }
    };

    let testRepository;

    beforeEach(async () => {
        testRepository = { constructStorage };
    });

    afterEach(async () => {
        testRepository = null;
    });

    describe('Read-side interface created by adapter init function', () => {
        let readInstance;

        beforeEach(async () => {
            const defaultDictionaryStorage = await constructStorage(DICTIONARY_TYPE);
            for (let key of Object.keys(DEFAULT_ENTRIES)) {
                defaultDictionaryStorage.set(key, DEFAULT_ENTRIES[key]);
            }

            readInstance = init(testRepository);

            testRepository.storagesMap.set(DEFAULT_DICTIONARY_NAME, {
                content: defaultDictionaryStorage,
                type: DICTIONARY_TYPE
            });
        });

        afterEach(async () => {
            readInstance = null;
        });

        describe('Storage manager', () => {
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
                    await readable.dictionary('wrong-dictionary');
                    return Promise.reject(
                        'Unexisting dictionary call should throw error on read side'
                    );
                } catch (err) {
                    expect(err.message).to.be.equal(
                        messages.unexistingStorage(DICTIONARY_TYPE, 'wrong-dictionary')
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

            it('should throw error on dictionary delete operation attempt', async () => {
                const readable = await readInstance.getReadable();
                const dictionary = await readable.dictionary(DEFAULT_DICTIONARY_NAME);

                try {
                    await dictionary.delete('id3');
                    return Promise.reject('dictionary delete operation should fail on read-side');
                } catch (err) {
                    expect(err.message).to.be.equal(
                        messages.readSideForbiddenOperation(
                            DICTIONARY_TYPE,
                            'delete',
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
                Init: sinon.stub().callsFake(async (store) => {
                    await new Promise((resolve, reject) =>
                        setImmediate(
                            () => (!initShouldFail ? resolve() : reject(new Error('Init Failure')))
                        )
                    );
                    await store.createDictionary(DEFAULT_DICTIONARY_NAME);
                }),

                TestEvent: sinon.stub(),

                EventCheckEqualStorages: async (store) => {
                    const storeFirst = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    const storeSecond = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    if (storeFirst === storeSecond) {
                        throw new Error('Storages is equal');
                    }
                },

                EventRecreateStore: async (store) => {
                    await store.createDictionary(DEFAULT_DICTIONARY_NAME);
                },

                EventMisuseStore: async (store) => {
                    await store.dictionary('CUSTOM_STORAGE');
                },

                EventWrongDropStore: async (store) => {
                    await store.drop('WRONG_STORAGE');
                },

                EventDictionarySet: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.set(FIELD_NAME, { test: 'fail' });
                    await dictionary.set(FIELD_NAME, { test: 'ok' });
                },

                EventDictionaryDelete: async (store) => {
                    const dictionary = await store.dictionary(DEFAULT_DICTIONARY_NAME);
                    await dictionary.set(FIELD_NAME, { test: 'fail' });
                    await dictionary.delete(FIELD_NAME);
                }
            };

            builtTestProjection = buildProjection(testRepository, originalTestProjection);
            readInstance = init(testRepository);

            testRepository.storagesMap.set('CUSTOM_STORAGE', {
                type: 'CUSTOM_TYPE',
                content: null
            });
        });

        afterEach(async () => {
            originalTestProjection = null;
            builtTestProjection = null;
            initShouldFail = null;
            readInstance = null;
        });

        describe('Read model initialization', () => {
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

            it('should reuse storage interfaces which already initialized', async () => {
                let lastError = await readInstance.getError();
                expect(lastError).to.be.equal(null);

                await builtTestProjection.EventCheckEqualStorages({
                    type: 'EventCheckEqualStorages',
                    timestamp: 10
                });

                lastError = await readInstance.getError();
                expect(lastError.message).to.be.equal('Storages is equal');
            });

            it('should fail on recreation storage attempt', async () => {
                let lastError = await readInstance.getError();
                expect(lastError).to.be.equal(null);

                await builtTestProjection.EventRecreateStore({
                    type: 'EventRecreateStore',
                    timestamp: 10
                });

                lastError = await readInstance.getError();
                expect(lastError.message).to.be.equal(
                    messages.storageRecreation(DICTIONARY_TYPE, DEFAULT_DICTIONARY_NAME)
                );
            });

            it('should fail on wrong storage use with mismatch type attempt', async () => {
                let lastError = await readInstance.getError();
                expect(lastError).to.be.equal(null);

                await builtTestProjection.EventMisuseStore({
                    type: 'EventMisuseStore',
                    timestamp: 10
                });

                lastError = await readInstance.getError();
                expect(lastError.message).to.be.equal(
                    messages.wrongStorageType('CUSTOM_STORAGE', 'CUSTOM_TYPE', DICTIONARY_TYPE)
                );
            });

            it('should fail on dropping unexisting storage', async () => {
                let lastError = await readInstance.getError();
                expect(lastError).to.be.equal(null);

                await builtTestProjection.EventWrongDropStore({
                    type: 'EventWrongDropStore',
                    timestamp: 10
                });

                lastError = await readInstance.getError();
                expect(lastError.message).to.be.equal(
                    messages.unexistingStorage(null, 'WRONG_STORAGE')
                );
            });
        });

        describe('Dictionary interface', () => {
            it('should process dictionary set operation', async () => {
                await builtTestProjection.EventDictionarySet({
                    type: 'EventDictionarySet',
                    timestamp: 10
                });

                const storage = testRepository.storagesMap.get(DEFAULT_DICTIONARY_NAME).content;
                const result = storage.get(FIELD_NAME);

                expect(result).to.be.deep.equal({ test: 'ok' });
            });

            it('should process dictionary remove operation', async () => {
                await builtTestProjection.EventDictionaryDelete({
                    type: 'EventDictionaryDelete',
                    timestamp: 10
                });

                const storage = testRepository.storagesMap.get(DEFAULT_DICTIONARY_NAME).content;
                const result = storage.has(FIELD_NAME);

                expect(result).to.be.deep.equal(false);
            });
        });
    });

    describe('Disposing adapter with reset function', () => {
        let readInstance;
        let defaultDictionaryStorage;

        beforeEach(async () => {
            defaultDictionaryStorage = await constructStorage(DICTIONARY_TYPE);
            for (let key of Object.keys(DEFAULT_ENTRIES)) {
                defaultDictionaryStorage.set(key, DEFAULT_ENTRIES[key]);
            }

            readInstance = init(testRepository);

            testRepository.storagesMap.set(DEFAULT_DICTIONARY_NAME, {
                content: defaultDictionaryStorage,
                type: DICTIONARY_TYPE
            });

            await readInstance.getReadable();
        });

        afterEach(async () => {
            defaultDictionaryStorage = null;
            readInstance = null;
        });

        it('should close connection and dispose target dictionarys', async () => {
            const disposePromise = reset(testRepository);
            await disposePromise;

            const findResult = Array.from(defaultDictionaryStorage.entries());

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
