import { expect } from 'chai';
import mockFs from 'mock-fs';
import adapter from '../src/index';

const row1 = {
    type: 'testtype_1',
    aggregate: {
        id: '1'
    },
    payload: {}
};
const row2 = {
    type: 'testtype_1',
    aggregate: {
        id: '2'
    },
    payload: {}
};
const row3 = {
    type: 'testtype_1',
    aggregate: {
        id: '3'
    },
    payload: {}
};
const row4 = {
    type: 'testtype_2',
    aggregate: {
        id: '4'
    },
    payload: {}
};
const newRow = {
    type: 'testtype_3',
    aggregate: {
        id: '5'
    },
    payload: {}
};

const rows = [
    row1,
    row2,
    row3,
    row4
];

const TEST_PATH = './testpath.txt';

mockFs({
    [TEST_PATH]: JSON.stringify(rows)
});

const eventstore = adapter({ pathToFile: TEST_PATH });

describe('eventstore-file', () => {
    after(() => {
        mockFs.restore();
    });

    it('load events by types', () => eventstore
        .loadEventsByTypes(['testtype_1'], (result) => {
            expect(result).to.be.deep.equal([
                row1,
                row2,
                row3
            ]);
        }));

    it('load events by aggregate id', () => eventstore
        .loadEventsByAggregateId('4', (result) => {
            expect(result).to.be.deep.equal(row4);
        }));

    it('save event', () => eventstore.saveEvent(newRow)
        .then(() => eventstore.loadEventsByAggregateId('5', (result) => {
            expect(result).to.be.deep.equal(newRow);
        })));
});
