import { expect } from 'chai';
import mockFs from 'mock-fs';
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

const FILE_CONTENT = [row1, row2, row3, row4].map(row => `${JSON.stringify(row)},`).join('');
const TEST_PATH = './testpath.txt';

const eventstore = driver({ pathToFile: TEST_PATH });

describe('es-file', () => {
    before(() => {
        mockFs({
            [TEST_PATH]: FILE_CONTENT
        });
    });

    after(() => {
        mockFs.restore();
    });

    it('load events by types', () => {
        const result = [];
        return eventstore
            .loadEventsByTypes(['testtype_1'], (item) => {
                result.push(item);
            })
            .then(() => {
                expect(result).to.be.deep.equal([row2, row3, row1]);
            });
    });

    it('load events by aggregate id', () => {
        const result = [];
        return eventstore
            .loadEventsByAggregateId('3', (item) => {
                result.push(item);
            })
            .then(() => {
                expect(result).to.be.deep.equal([row4, row3]);
            });
    });

    it('save event', () =>
        eventstore.saveEvent(row5).then(() =>
            eventstore.loadEventsByAggregateId('5', (result) => {
                expect(result).to.be.deep.equal(row5);
            })
        ));

    it('does not fail when file does not exist', () => {
        mockFs.restore();
        return eventstore.loadEventsByTypes([], () => 0);
    });

    it('works the same way for different import types', () => {
        expect(driver).to.be.equal(require('../src'));
    });
});
