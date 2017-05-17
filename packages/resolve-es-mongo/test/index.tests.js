import sinon from 'sinon';
import { expect } from 'chai';
import { MongoClient, _setFindResult } from 'mongodb';

import createAdapter from '../src';

const adapterSettings = {
    url: 'test-url',
    collection: 'test-collection'
};

const testEvent = {
    id: '1',
    type: 'event-type'
};

describe('es-mongo', () => {
    afterEach(() => {
        _setFindResult(null);
        MongoClient.connect.reset();
    });

    it('should save event', () => {
        const adapter = createAdapter(adapterSettings);

        return adapter
            .saveEvent(testEvent)
            .then(() => {
                expect(MongoClient.connect.lastCall.args).to.deep.equal(['test-url']);
                return MongoClient.connect.lastCall.returnValue;
            })
            .then((db) => {
                expect(db.collection.lastCall.args).to.deep.equal(['test-collection']);
                expect(db.collection.lastCall.returnValue.insert.lastCall.args).to.deep.equal([
                    testEvent
                ]);

                expect(
                    db.collection.lastCall.returnValue.ensureIndex.firstCall.args
                ).to.be.deep.equal(['timestamp']);

                expect(
                    db.collection.lastCall.returnValue.ensureIndex.secondCall.args
                ).to.be.deep.equal(['aggregateId']);
            });
    });

    it('should load events by types', () => {
        const adapter = createAdapter(adapterSettings);
        const types = ['event-type-1', 'event-type-2'];
        const eventsByTypes = [
            { id: '1', type: 'event-type-1' },
            { id: '1', type: 'event-type-2' }
        ];
        const processEvent = sinon.spy();
        _setFindResult(eventsByTypes);

        return adapter
            .loadEventsByTypes(types, processEvent)
            .then(() => MongoClient.connect.lastCall.returnValue)
            .then((db) => {
                expect(db.collection.lastCall.args).to.deep.equal(['test-collection']);
                expect(db.collection.lastCall.returnValue.find.lastCall.args).to.deep.equal([
                    { type: { $in: types } },
                    { sort: 'timestamp' }
                ]);

                expect(processEvent.args).to.deep.equal([[eventsByTypes[0]], [eventsByTypes[1]]]);
            });
    });

    it('should load events by aggregate id', () => {
        const adapter = createAdapter(adapterSettings);
        const aggregateId = 'test-aggregate-id';
        const eventsByAggregateId = [{ id: '1', aggregateId }, { id: '1', aggregateId }];

        const processEvent = sinon.spy();
        _setFindResult(eventsByAggregateId);

        return adapter
            .loadEventsByAggregateId(aggregateId, processEvent)
            .then(() => MongoClient.connect.lastCall.returnValue)
            .then((db) => {
                expect(db.collection.lastCall.args).to.deep.equal(['test-collection']);
                expect(db.collection.lastCall.returnValue.find.lastCall.args).to.deep.equal([
                    { aggregateId },
                    { sort: 'timestamp' }
                ]);

                expect(processEvent.args).to.deep.equal([
                    [eventsByAggregateId[0]],
                    [eventsByAggregateId[1]]
                ]);
            });
    });
});
