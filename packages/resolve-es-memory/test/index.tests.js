import { expect } from 'chai';
import adapter from '../src/index';

const row1 = {
    __type: 'testtype_1',
    __aggregateId: '1',
    payload: {}
};
const row2 = {
    __type: 'testtype_1',
    __aggregateId: '2',
    payload: {}
};
const row3 = {
    __type: 'testtype_1',
    __aggregateId: '3',
    payload: {}
};
const row4 = {
    __type: 'testtype_2',
    __aggregateId: '4',
    payload: {}
};
const row5 = {
    __type: 'testtype_3',
    __aggregateId: '5',
    payload: {}
};

const rows = [
    row1,
    row2,
    row3,
    row4
];

describe('es-memory', () => {
    it('load events by types', () => {
        const eventstore = adapter(rows);
        const result = [];

        return eventstore
            .loadEventsByTypes(['testtype_1'], (item) => {
                result.push(item);
            })
            .then(() => {
                expect(result).to.be.deep.equal([
                    row1,
                    row2,
                    row3
                ]);
            });
    });

    it('load events by aggregate id', () => {
        const eventstore = adapter(rows);

        return eventstore
            .loadEventsByAggregateId('4', (result) => {
                expect(result).to.be.deep.equal(row4);
            });
    });

    it('save event', () => {
        const eventstore = adapter(rows);

        return eventstore
            .saveEvent(row5)
            .then(() => eventstore.loadEventsByAggregateId('5', (result) => {
                expect(result).to.be.deep.equal(row5);
            }));
    })
});
