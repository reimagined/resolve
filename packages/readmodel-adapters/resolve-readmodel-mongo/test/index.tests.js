import 'regenerator-runtime/runtime';

import { expect } from 'chai';
import sinon from 'sinon';

import buildProjection from '../src/init';
import init from '../src/init';
import reset from '../src/init';

process.on('unhandledRejection', (...args) => console.log(...args));

describe('Read model MongoDB adapter', () => {
    let fakeLastReadResult;
    let fakeRepository;
    let fakeDatabase;

    beforeEach(() => {
        fakeDatabase = {
            _collections: {},
            listCollections: sinon.stub().callsFake(({ name: collectionName }) => ({
                toArray: sinon
                    .stub()
                    .callsFake(async () =>
                        Object.keys(fakeDatabase._collections).filter(
                            name => name.indexOf(collectionName) > -1
                        )
                    )
            })),
            collection: sinon.stub().callsFake(async (collectionName) => {
                if (!fakeDatabase._collections[collectionName]) {
                    fakeDatabase._collections[collectionName] = {
                        find: sinon.stub().callsFake(() => {
                            const findApi = {
                                skip: sinon.stub().callsFake(() => {
                                    return findApi;
                                }),
                                limit: sinon.stub().callsFake(() => {
                                    return findApi;
                                }),
                                toArray: sinon.stub().callsFake(async () => {
                                    return fakeLastReadResult;
                                })
                            };
                            return findApi;
                        }),
                        findOne: sinon.stub().callsFake(async () => {
                            return fakeLastReadResult;
                        }),
                        count: sinon.stub().callsFake(async () => {
                            return fakeLastReadResult;
                        }),
                        createIndex: sinon.spy(),
                        dropIndex: sinon.spy(),
                        insert: sinon.spy(),
                        update: sinon.spy(),
                        remove: sinon.spy()
                    };
                }

                return fakeDatabase._collections[collectionName];
            })
        };

        fakeRepository = {
            metaCollectionName: 'TestMetaCollection',
            connectDatabase: async () => fakeDatabase
        };
    });

    afterEach(() => {
        fakeLastReadResult = null;
        fakeRepository = null;
        fakeDatabase = null;
    });

    describe('Build Projection function', () => {});

    describe('Init function', () => {
        let readInstance = null;
        beforeEach(() => {
            fakeLastReadResult = [];
            readInstance = init(fakeRepository);
        });
        afterEach(() => {
            readInstance = null;
        });

        it('should fill repository with internal fields', () => {
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
            await fakeRepository.connectionPromise;
            const lastTimestamp = await readInstance.getLastAppliedTimestamp();
            const readable = await readInstance.getReadable();
            const lastError = await readInstance.getError();

            expect(lastTimestamp).to.be.equal(1);
            expect(readable).to.be.equal(fakeRepository.readInterface);
            expect(lastError).to.be.equal(null);
        });
    });

    describe('Reset function', () => {});
});
