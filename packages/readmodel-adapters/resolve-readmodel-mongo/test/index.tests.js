import 'regenerator-runtime/runtime';

import { expect } from 'chai';
import mongoUnit from 'mongo-unit';
import { MongoClient } from 'mongodb';
import sinon from 'sinon';

import buildProjection from '../src/init';
import init from '../src/init';
import reset from '../src/init';

describe('Read model MongoDB adapter', () => {
    const DEFAULT_COLLECTION_NAME = 'TestDefaultCollection';
    const META_COLLECTION_NAME = 'TestMetaCollection';
    const DEFAULT_DOCUMENTS = [
        { id: 0, content: 'test-0' },
        { id: 1, content: 'test-1' },
        { id: 2, content: 'test-2' }
    ];

    let testRepository;
    let testConnection;

    before(async function () {
        this.timeout(0);
        const connectionUrl = await mongoUnit.start();
        testConnection = await MongoClient.connect(connectionUrl);
    });

    after(async () => {
        await mongoUnit.drop();
        testConnection = null;
    });

    beforeEach(async () => {
        testRepository = {
            connectDatabase: async () => testConnection,
            metaCollectionName: META_COLLECTION_NAME
        };

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
    });

    afterEach(async () => {
        for (let { name } of await testConnection.listCollections({}).toArray()) {
            const collection = await testConnection.collection(name);
            await collection.drop();
        }

        testRepository = null;
    });

    describe('Build Projection function', () => {});

    describe('Init function', () => {
        it('should provide proper read-side interface', async () => {
            const readInstance = init(testRepository);
            const lastTimestamp = await readInstance.getLastAppliedTimestamp();
            const readable = await readInstance.getReadable();
            const lastError = await readInstance.getError();

            expect(lastTimestamp).to.be.equal(30);

            expect(readable).to.be.an.instanceof(Object);
            expect(readable.collection).to.be.an.instanceof(Function);
            expect(readable.listCollections).to.be.an.instanceof(Function);

            expect(lastError).to.be.equal(null);
        });

        it('should throw error on read-side on non-existing collections', async () => {
            const readInstance = init(testRepository);
            const readable = await readInstance.getReadable();

            try {
                await readable.collection('wrong');
                return Promise.reject('Unexisting collection call should throw error on read side');
            } catch (err) {
                expect(err.message).to.be.equal('Collection wrong does not exist');
            }
        });

        it('should provide simple find operation on read-side', async () => {
            const readInstance = init(testRepository);
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection.find({});
            expect(result).to.be.deep.equal(DEFAULT_DOCUMENTS);
        });

        it('should provide find + condition match operation on read-side', async () => {
            const readInstance = init(testRepository);
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection.find({ id: 1 });
            expect(result).to.be.deep.equal([DEFAULT_DOCUMENTS[1]]);
        });

        it('should provide find + skip operation with skip on read-side', async () => {
            const readInstance = init(testRepository);
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection.find({}).skip(1);
            expect(result).to.be.deep.equal(DEFAULT_DOCUMENTS.slice(1, 3));
        });

        it('should provide find + limit operation with skip on read-side', async () => {
            const readInstance = init(testRepository);
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection.find({}).limit(2);
            expect(result).to.be.deep.equal(DEFAULT_DOCUMENTS.slice(0, 2));
        });

        it('should provide find + skip + limit operation with skip on read-side', async () => {
            const readInstance = init(testRepository);
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            const result = await collection
                .find({})
                .skip(2)
                .limit(1);
            expect(result).to.be.deep.equal([DEFAULT_DOCUMENTS[2]]);
        });

        it('should provide actual collections list on read-side', async () => {
            const readInstance = init(testRepository);
            const readable = await readInstance.getReadable();
            const collectionsList = await readable.listCollections();

            expect(collectionsList).to.be.deep.equal([DEFAULT_COLLECTION_NAME]);
        });

        it('should throw error on collection create index mutation attempt on read-side ', async () => {
            const readInstance = init(testRepository);
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.ensureIndex({ test: 1 });
                return Promise.reject(
                    'Collection ensureIndex operation should fail on client side'
                );
            } catch (err) {
                expect(err.message).to.be.equal(
                    `The ${DEFAULT_COLLECTION_NAME} collection’s ensureIndex method ` +
                        'is not allowed on the read side'
                );
            }
        });

        it('should throw error on collection remove index mutation attempt on read-side ', async () => {
            const readInstance = init(testRepository);
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.removeIndex('test');
                return Promise.reject(
                    'Collection removeIndex operation should fail on client side'
                );
            } catch (err) {
                expect(err.message).to.be.equal(
                    `The ${DEFAULT_COLLECTION_NAME} collection’s removeIndex method ` +
                        'is not allowed on the read side'
                );
            }
        });

        it('should throw error on collection insert mutation attempt on read-side ', async () => {
            const readInstance = init(testRepository);
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.insert({ test: 0 });
                return Promise.reject('Collection insert operation should fail on client side');
            } catch (err) {
                expect(err.message).to.be.equal(
                    `The ${DEFAULT_COLLECTION_NAME} collection’s insert method ` +
                        'is not allowed on the read side'
                );
            }
        });

        it('should throw error on collection update mutation attempt on read-side ', async () => {
            const readInstance = init(testRepository);
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.update({ test: 0 }, { test: 1 });
                return Promise.reject('Collection update operation should fail on client side');
            } catch (err) {
                expect(err.message).to.be.equal(
                    `The ${DEFAULT_COLLECTION_NAME} collection’s update method ` +
                        'is not allowed on the read side'
                );
            }
        });

        it('should throw error on collection remove mutation attempt on read-side ', async () => {
            const readInstance = init(testRepository);
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            try {
                await collection.remove({ test: 0 });
                return Promise.reject('Collection remove operation should fail on client side');
            } catch (err) {
                expect(err.message).to.be.equal(
                    `The ${DEFAULT_COLLECTION_NAME} collection’s remove method ` +
                        'is not allowed on the read side'
                );
            }
        });
    });

    describe('Reset function', () => {});
});
