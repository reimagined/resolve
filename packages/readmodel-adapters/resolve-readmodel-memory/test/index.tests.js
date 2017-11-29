import { expect } from 'chai';

import createMemoryAdapter from '../src/index';

describe('Read model memory adapter', () => {
    let projection, adapter, getReadable, getError;

    beforeEach(async () => {
        adapter = createMemoryAdapter();

        projection = adapter.buildProjection({
            Init: async (store) => {
                const TestCollection = await store.collection('Test');
                await TestCollection.ensureIndex({ fieldName: 'id' });
                await TestCollection.insert({ id: 0, text: 'Initial' });
            },
            TestEvent: async (store, event) => {
                if (event.crashFlag) {
                    throw new Error('Test crashing event');
                }
                const TestCollection = await store.collection('Test');

                const lastId = (await TestCollection.find({})
                    .sort({ id: -1 })
                    .limit(1))[0].id;

                await TestCollection.insert({
                    id: lastId + 1,
                    text: event.text
                });
            }
        });

        const readSide = adapter.init();
        getReadable = readSide.getReadable;
        getError = readSide.getError;

        await getReadable();
    });

    afterEach(() => {
        projection = null;
        adapter.reset();
        getReadable = null;
        getError = null;
        adapter = null;
    });

    it('should have apropriate API', () => {
        expect(adapter.buildProjection).to.be.a('function');
        expect(adapter.init).to.be.a('function');
        expect(adapter.reset).to.be.a('function');
    });

    it('should fill store by incoming events', async () => {
        await projection.TestEvent({ text: 'First text' });
        await projection.TestEvent({ text: 'Second text' });

        const store = await getReadable();
        const TestCollection = await store.collection('Test');
        const records = await TestCollection.find({ id: { $gt: 0 } }).sort({ id: 1 });

        expect(records[0].text).to.be.equal('First text');
        expect(records[0].id).to.be.equal(1);
        expect(records[1].text).to.be.equal('Second text');
        expect(records[1].id).to.be.equal(2);
    });

    it('should handle projection-side errors', async () => {
        await projection.TestEvent({ crashFlag: true });
        const lastError = await getError();

        expect(lastError.message).to.be.equal('Test crashing event');
    });
});
