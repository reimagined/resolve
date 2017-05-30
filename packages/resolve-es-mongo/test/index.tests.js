import sinon from 'sinon';
import { expect } from 'chai';
import { MongoClient, _setFindResult } from 'mongodb';

import createDriver from '../src';

const driverSettings = {
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
        const driver = createDriver(driverSettings);

        return driver
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
                    db.collection.lastCall.returnValue.createIndex.firstCall.args
                ).to.be.deep.equal(['timestamp']);

                expect(
                    db.collection.lastCall.returnValue.createIndex.secondCall.args
                ).to.be.deep.equal(['aggregateId']);
            });
    });

    it('should load events by types', () => {
        const driver = createDriver(driverSettings);
        const types = ['event-type-1', 'event-type-2'];
        const eventsByTypes = [
            { id: '1', type: 'event-type-1' },
            { id: '1', type: 'event-type-2' }
        ];
        const processEvent = sinon.spy();
        _setFindResult(eventsByTypes);

        return driver
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
        const driver = createDriver(driverSettings);
        const aggregateId = 'test-aggregate-id';
        const eventsByAggregateId = [{ id: '1', aggregateId }, { id: '1', aggregateId }];

        const processEvent = sinon.spy();
        _setFindResult(eventsByAggregateId);

        return driver
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

    it('works the same way for different import types', () => {
        expect(createDriver).to.be.equal(require('../src'));
    });
});
