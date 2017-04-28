import sinon from 'sinon';
import { expect } from 'chai';
import { MongoClient, _setToArray } from 'mongodb';

import createAdapter from '../src';

const adapterSettings = {
    url: 'test-url',
    collection: 'test-collection'
};

const testEvent = {
    id: '1',
    __type: 'event-type'
};

describe('es-mongo', () => {
    afterEach(() => {
        _setToArray(null);
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
            });
    });

    it('should load events by types', () => {
        const adapter = createAdapter(adapterSettings);
        const types = ['event-type-1', 'event-type-2'];
        const eventsByTypes = [
            {
                id: '1',
                type: 'event-type-1'
            },
            {
                id: '1',
                type: 'event-type-2'
            }
        ];
        const processEvent = sinon.spy();

        _setToArray(() => Promise.resolve(eventsByTypes));

        return adapter
            .loadEventsByTypes(types, processEvent)
            .then(() => MongoClient.connect.lastCall.returnValue)
            .then((db) => {
                expect(db.collection.lastCall.args).to.deep.equal(['test-collection']);
                expect(db.collection.lastCall.returnValue.find.lastCall.args).to.deep.equal([
                    { __type: { $in: types } }
                ]);

                const find = db.collection.lastCall.returnValue.find.lastCall.returnValue;

                expect(find.sort.lastCall.args).to.deep.equal([{ timestamp: 1 }]);
                expect(find.skip.lastCall.args).to.deep.equal([0]);
                expect(find.limit.lastCall.args).to.deep.equal([1000]);

                expect(processEvent.args).to.deep.equal([[eventsByTypes[0]], [eventsByTypes[1]]]);
            });
    });

    it('should load events by aggregate id', () => {
        const adapter = createAdapter(adapterSettings);
        const aggregateId = 'test-aggregate-id';
        const eventsByAggregateId = [
            {
                id: '1',
                aggregateId
            },
            {
                id: '1',
                aggregateId
            }
        ];

        const processEvent = sinon.spy();
        _setToArray(() => Promise.resolve(eventsByAggregateId));

        return adapter
            .loadEventsByAggregateId(aggregateId, processEvent)
            .then(() => MongoClient.connect.lastCall.returnValue)
            .then((db) => {
                expect(db.collection.lastCall.args).to.deep.equal(['test-collection']);
                expect(db.collection.lastCall.returnValue.find.lastCall.args).to.deep.equal([
                    { __aggregateId: aggregateId }
                ]);

                const find = db.collection.lastCall.returnValue.find.lastCall.returnValue;

                expect(find.sort.lastCall.args).to.deep.equal([{ timestamp: 1 }]);
                expect(find.skip.lastCall.args).to.deep.equal([0]);
                expect(find.limit.lastCall.args).to.deep.equal([1000]);

                expect(processEvent.args).to.deep.equal([
                    [eventsByAggregateId[0]],
                    [eventsByAggregateId[1]]
                ]);
            });
    });

    it('should load events using batching', () => {
        const adapter = createAdapter(adapterSettings);
        const types = ['event-type-1', 'event-type-2'];
        const processEvent = sinon.spy();
        const toArray = sinon.stub();
        const getArray = (length) => {
            const a = [];
            for (let i = 0; i < length; i++) {
                a[i] = i;
            }
            return a;
        };

        toArray.onCall(0).returns(Promise.resolve(getArray(1000)));
        toArray.onCall(1).returns(Promise.resolve(getArray(1000)));
        toArray.onCall(2).returns(Promise.resolve(getArray(200)));

        _setToArray(toArray);

        return adapter
            .loadEventsByTypes(types, processEvent)
            .then(() => MongoClient.connect.lastCall.returnValue)
            .then((db) => {
                const find = db.collection.lastCall.returnValue.find;

                expect(find.callCount).to.equal(3);

                expect(find.getCall(0).returnValue.skip.lastCall.args).to.deep.equal([0]);
                expect(find.getCall(1).returnValue.skip.lastCall.args).to.deep.equal([1000]);
                expect(find.getCall(2).returnValue.skip.lastCall.args).to.deep.equal([2000]);

                expect(find.getCall(0).returnValue.limit.lastCall.args).to.deep.equal([1000]);
                expect(find.getCall(1).returnValue.limit.lastCall.args).to.deep.equal([1000]);
                expect(find.getCall(2).returnValue.limit.lastCall.args).to.deep.equal([1000]);

                expect(processEvent.callCount).to.equal(2200);
            });
    });
});
