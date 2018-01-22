import 'regenerator-runtime/runtime';

import { expect } from 'chai';
import NeDB from 'nedb';
import sinon from 'sinon';

import messages from '../src/messages';
import buildProjection from '../src/build_projection';
import init from '../src/init';
import reset from '../src/reset';

describe('Read model MongoDB adapter', () => {
    const META_COLLECTION_NAME = '__MetaCollection__';
    const COLLECTIONS_PREFIX = '_Prefix_';

    const DEFAULT_DICTIONARY_NAME = 'TestdefaultDictionaryStorage';
    const DEFAULT_ENTRIES = {
        id0: { content: 'test0' },
        id1: { content: 'test1' },
        id2: { content: 'test2' }
    };

    let storedCollections;
    let testConnection;
    let testRepository;

    beforeEach(async () => {
        storedCollections = {};

        const createCollection = async (collectionName) => {
            const originalDb = new NeDB({ autoload: true, inMemoryOnly: true });
            const unaryExecutor = (resolve, reject, err, value) =>
                !err ? resolve(value) : reject(err);
            const unaryWrapper = (oper, args, resolve, reject) =>
                originalDb[oper](...args, unaryExecutor.bind(null, resolve, reject));
            const voidExecutor = (resolve, reject, err) => (!err ? resolve() : reject(err));
            const voidWrapper = (oper, args, resolve, reject) =>
                originalDb[oper](...args, voidExecutor.bind(null, resolve, reject));
            const toArrayImpl = searchPattern =>
                new Promise((resolve, reject) =>
                    originalDb.find(
                        searchPattern,
                        (err, docs) => (!err ? resolve(docs) : reject(err))
                    )
                );
            return {
                find: searchPattern => ({ toArray: toArrayImpl.bind(null, searchPattern) }),
                findOne: (...args) => new Promise(unaryWrapper.bind(null, 'findOne', args)),
                count: (...args) => new Promise(unaryWrapper.bind(null, 'count', args)),
                insert: (...args) => new Promise(voidWrapper.bind(null, 'insert', args)),
                update: (...args) => new Promise(voidWrapper.bind(null, 'update', args)),
                remove: (...args) => new Promise(voidWrapper.bind(null, 'remove', args)),
                createIndex: (index, options) =>
                    new Promise(
                        voidWrapper.bind(null, 'ensureIndex', [
                            {
                                fieldName: Object.keys(index)[0],
                                ...options
                            }
                        ])
                    ),
                dropIndex: (...args) => new Promise(voidWrapper.bind(null, 'removeIndex', args)),
                drop: async () => {
                    await new Promise((resolve, reject) =>
                        storedCollections[collectionName].remove(
                            {},
                            { multi: true },
                            err => (!err ? resolve() : reject(err))
                        )
                    );
                    delete storedCollections[collectionName];
                }
            };
        };

        testConnection = {
            async collection(name) {
                if (!storedCollections[name]) {
                    storedCollections[name] = await createCollection(name);
                }
                return storedCollections[name];
            },
            async dropCollection(name) {
                if (storedCollections[name]) {
                    await storedCollections[name].drop();
                }
            },
            close: sinon.stub()
        };

        testRepository = {
            connectDatabase: async () => testConnection,
            metaCollectionName: META_COLLECTION_NAME,
            collectionsPrefix: COLLECTIONS_PREFIX
        };
    });

    afterEach(async () => {
        storedCollections = null;
        testConnection = null;
        testRepository = null;
    });

    describe('Read-side interface created by adapter init function', () => {
        let readInstance;

        beforeEach(async () => {
            const defaultCollection = await testConnection.collection(
                `${COLLECTIONS_PREFIX}${DEFAULT_DICTIONARY_NAME}`
            );

            for (let field of Object.keys(DEFAULT_ENTRIES)) {
                await defaultCollection.insert({
                    field,
                    value: DEFAULT_ENTRIES[field]
                });
            }

            const metaCollection = await testConnection.collection(
                `${COLLECTIONS_PREFIX}${META_COLLECTION_NAME}`
            );

            await metaCollection.insert({
                key: DEFAULT_DICTIONARY_NAME,
                lastTimestamp: 30
            });

            readInstance = init(testRepository);
        });

        afterEach(async () => {
            readInstance = null;
        });

        it('should provide last timestamp as zero value', async () => {
            const lastTimestamp = await readInstance.getLastAppliedTimestamp();
            expect(lastTimestamp).to.be.equal(30);
        });

        it('should throw error on non-existing storage access', async () => {
            const readable = await readInstance.getReadable();

            try {
                await readable.hget('wrong-dictionary', 'key');
                return Promise.reject('Unexisting dictionary call should throw error on read side');
            } catch (err) {
                expect(err.message).to.be.equal(messages.unexistingStorage('wrong-dictionary'));
            }
        });

        it('should throw error on storage drop attempt', async () => {
            const readable = await readInstance.getReadable();

            try {
                await readable.del(DEFAULT_DICTIONARY_NAME);
                return Promise.reject('dictionary drop operation should fail on read-side');
            } catch (err) {
                expect(err.message).to.be.equal(
                    messages.readSideForbiddenOperation('del', DEFAULT_DICTIONARY_NAME)
                );
            }
        });

        it('should provide dictionary get operation', async () => {
            const readable = await readInstance.getReadable();
            const firstResult = await readable.hget(DEFAULT_DICTIONARY_NAME, 'id0');
            const secondResult = await readable.hget(DEFAULT_DICTIONARY_NAME, 'id4');

            expect(firstResult).to.be.deep.equal({ content: 'test0' });
            expect(secondResult).to.be.deep.equal(null);
        });

        it('should throw error on dictionary set operation attempt', async () => {
            const readable = await readInstance.getReadable();

            try {
                await readable.hset(DEFAULT_DICTIONARY_NAME, 'id4', { content: 'test-4' });
                return Promise.reject('dictionary set operation should fail on read-side');
            } catch (err) {
                expect(err.message).to.be.equal(
                    messages.readSideForbiddenOperation('hset', DEFAULT_DICTIONARY_NAME)
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
                Init: sinon.stub().callsFake(async (store) => {
                    await new Promise((resolve, reject) =>
                        setImmediate(
                            () => (!initShouldFail ? resolve() : reject(new Error('Init Failure')))
                        )
                    );
                }),

                TestEvent: sinon.stub(),

                EventDictionaryGet: async (store) => {
                    await store.hget('NEW_DICTIONARY', FIELD_NAME);
                },

                EventDictionarySet: async (store) => {
                    await store.hset(DEFAULT_DICTIONARY_NAME, FIELD_NAME, { test: 'fail' });
                    await store.hset(DEFAULT_DICTIONARY_NAME, FIELD_NAME, { test: 'ok' });
                },

                EventDictionaryDelete: async (store) => {
                    await store.hset(DEFAULT_DICTIONARY_NAME, FIELD_NAME, { test: 'fail' });
                    await store.hset(DEFAULT_DICTIONARY_NAME, FIELD_NAME, null);
                },

                EventDictionaryDrop: async (store) => {
                    await store.hget(DEFAULT_DICTIONARY_NAME, FIELD_NAME);
                    await store.del(DEFAULT_DICTIONARY_NAME);
                    await store.del(DEFAULT_DICTIONARY_NAME);
                },

                WrongEvent: async () => {
                    throw new Error('Projection error');
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

        it('should handle errors in custom projection function', async () => {
            await builtTestProjection.WrongEvent({
                type: 'WrongEvent',
                timestamp: 10
            });

            const lastError = await readInstance.getError();
            expect(lastError.message).to.be.equal('Projection error');
        });

        it('should process dictionary get operation with key autocreation', async () => {
            await builtTestProjection.EventDictionaryGet({
                type: 'EventDictionaryGet',
                timestamp: 10
            });

            const storageExists = testRepository.storagesMap.has('NEW_DICTIONARY');
            expect(storageExists).to.be.equal(true);
        });

        it('should process dictionary set operation', async () => {
            await builtTestProjection.EventDictionarySet({
                type: 'EventDictionarySet',
                timestamp: 10
            });

            const storage = testRepository.storagesMap.get(DEFAULT_DICTIONARY_NAME);
            const result = await storage.findOne({ field: FIELD_NAME });

            expect(result.value).to.be.deep.equal({ test: 'ok' });
        });

        it('should process dictionary remove operation', async () => {
            await builtTestProjection.EventDictionaryDelete({
                type: 'EventDictionaryDelete',
                timestamp: 10
            });

            const storage = testRepository.storagesMap.get(DEFAULT_DICTIONARY_NAME);
            const result = await storage.count({ field: FIELD_NAME });

            expect(result).to.be.deep.equal(0);
        });

        it('should process dropping dictionary', async () => {
            await builtTestProjection.EventDictionaryDrop({
                type: 'EventDictionaryDrop',
                timestamp: 10
            });

            const storage = testRepository.storagesMap.get(DEFAULT_DICTIONARY_NAME);

            expect(storage).to.be.deep.equal(undefined);
        });
    });

    describe('Disposing adapter with reset function', () => {
        let readInstance;

        beforeEach(async () => {
            await testConnection.collection(`${COLLECTIONS_PREFIX}${DEFAULT_DICTIONARY_NAME}`);

            const metaCollection = await testConnection.collection(
                `${COLLECTIONS_PREFIX}${META_COLLECTION_NAME}`
            );

            await metaCollection.insert({
                key: DEFAULT_DICTIONARY_NAME,
                lastTimestamp: 0
            });

            readInstance = init(testRepository);

            await readInstance.getReadable();
        });

        afterEach(async () => {
            readInstance = null;
        });

        it('should close connection and dispose target dictionarys', async () => {
            const disposePromise = reset(testRepository);
            await disposePromise;

            expect(
                storedCollections[`${COLLECTIONS_PREFIX}${DEFAULT_DICTIONARY_NAME}`]
            ).to.be.equal(undefined);

            expect(storedCollections[`${COLLECTIONS_PREFIX}${META_COLLECTION_NAME}`]).to.be.equal(
                undefined
            );

            expect(testConnection.close.callCount).to.be.equal(1);
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
