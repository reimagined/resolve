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
    let fakeRepository;
    let fakeConnection;

    before(async function () {
        this.timeout(0);
        const connectionUrl = await mongoUnit.start();
        fakeConnection = await MongoClient.connect(connectionUrl);
    });

    after(async () => {
        await mongoUnit.drop();
        fakeConnection = null;
    });

    beforeEach(async () => {
        fakeRepository = {
            connectDatabase: async () => fakeConnection,
            metaCollectionName: META_COLLECTION_NAME
        };

        await mongoUnit.load({
            [DEFAULT_COLLECTION_NAME]: [
                { id: 0, content: 'test-0', ts: 10 },
                { id: 1, content: 'test-1', ts: 20 }
            ],
            [META_COLLECTION_NAME]: [
                {
                    collectionName: DEFAULT_COLLECTION_NAME,
                    lastTimestamp: 20,
                    indexes: ['id']
                }
            ]
        });
    });

    afterEach(async () => {
        //await mongoUnit.clean();
        fakeRepository = null;
    });

    describe('Build Projection function', () => {});

    describe('Init function', () => {
        it('should fill repository with internal fields', () => {
            init(fakeRepository);

            expect(fakeRepository.lastTimestamp).to.be.equal(0);
            expect(fakeRepository.initHandler).to.be.an.instanceof(Function);
            expect(fakeRepository.connectionPromise).to.be.an.instanceof(Promise);
            expect(fakeRepository.interfaceMap).to.be.an.instanceof(Map);
            expect(fakeRepository.internalError).to.be.equal(null);
            expect(fakeRepository.readInterface).to.be.an.instanceof(Object);
            expect(fakeRepository.writeInterface).to.be.an.instanceof(Object);
            expect(fakeRepository.initDonePromise).to.be.an.instanceof(Promise);
        });

        it('should provide proper read-side interface', async () => {
            const readInstance = init(fakeRepository);
            const lastTimestamp = await readInstance.getLastAppliedTimestamp();
            const readable = await readInstance.getReadable();
            const lastError = await readInstance.getError();

            expect(lastTimestamp).to.be.equal(20);
            expect(readable).to.be.equal(fakeRepository.readInterface);
            expect(lastError).to.be.equal(null);
        });

        it('should provide collection API on read-side on existing collections', async () => {
            const readInstance = init(fakeRepository);
            const readable = await readInstance.getReadable();
            const collection = await readable.collection(DEFAULT_COLLECTION_NAME);

            expect(collection).to.be.an.instanceof(Object);
            expect(collection.find).to.be.an.instanceof(Function);
            expect(collection.findOne).to.be.an.instanceof(Function);
            expect(collection.findCount).to.be.an.instanceof(Function);
        });

        it('should throw error on read-side on non-existing collections', async () => {
            const readInstance = init(fakeRepository);
            const readable = await readInstance.getReadable();

            try {
                await readable.collection('wrong');
                return Promise.reject('Unexisting collection call should throw error on read side');
            } catch (err) {
                expect(err.message).to.be.equal('Collection wrong does not exist');
            }
        });

        it('should provide actual collections list on read-side', async () => {
            const readInstance = init(fakeRepository);
            const readable = await readInstance.getReadable();
            const collectionsList = await readable.listCollections();

            expect(collectionsList).to.be.deep.equal('default');
        });
    });

    describe('Reset function', () => {});
});
