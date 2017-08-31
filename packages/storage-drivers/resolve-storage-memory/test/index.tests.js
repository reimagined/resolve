import { expect } from 'chai';
import driver from '../src/index';

const row1 = {
    type: 'testtype_1',
    aggregateId: '1',
    timestamp: 5,
    payload: {}
};
const row2 = {
    type: 'testtype_1',
    aggregateId: '2',
    timestamp: 1,
    payload: {}
};
const row3 = {
    type: 'testtype_1',
    aggregateId: '3',
    timestamp: 2,
    payload: {}
};
const row4 = {
    type: 'testtype_2',
    aggregateId: '3',
    timestamp: 1,
    payload: {}
};
const row5 = {
    type: 'testtype_3',
    aggregateId: '5',
    payload: {}
};

const rows = [row1, row2, row3, row4];

describe('es-memory', () => {
    it('load events by types', () => {
        const eventstore = driver(rows);
        const result = [];

        return eventstore
            .loadEventsByTypes(['testtype_1'], (item) => {
                result.push(item);
            })
            .then(() => {
                expect(result).to.be.deep.equal([row2, row3, row1]);
            });
    });

    it('load events by aggregate ids', () => {
        const eventstore = driver(rows);
        const result = [];

        return eventstore
            .loadEventsByAggregateId(['3'], (item) => {
                result.push(item);
            })
            .then(() => {
                expect(result).to.be.deep.equal([row4, row3]);
            });
    });

    it('save event', () => {
        const eventstore = driver(rows);

        return eventstore.saveEvent(row5).then(() =>
            eventstore.loadEventsByAggregateId(['5'], (result) => {
                expect(result).to.be.deep.equal(row5);
            })
        );
    });

    it('works the same way for different import types', () => {
        expect(driver).to.be.equal(require('../src'));
    });
});
