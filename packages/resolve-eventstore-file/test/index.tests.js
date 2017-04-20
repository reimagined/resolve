import { expect } from 'chai';
import sinon from 'sinon';
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
const row5 = {
    type: 'testtype_3',
    aggregate: {
        id: '5'
    },
    payload: {}
};
const row6 = {
    type: 'testtype_3',
    aggregate: {
        id: '6'
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

const eventstore = adapter({ pathToFile: TEST_PATH });

describe('eventstore-file', () => {
    before(() => {
        mockFs({
            [TEST_PATH]: JSON.stringify(rows)
        });
    });

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

    it('save event', () => eventstore
        .saveEvent(row5)
        .then(() => eventstore.loadEventsByAggregateId('5', (result) => {
            expect(result).to.be.deep.equal(row5);
        })));

    it('onEventSaved called', () => {
        const cb = sinon.spy();
        eventstore.onEventSaved(cb);

        return eventstore
            .saveEvent(row6)
            .then(() => {
                expect(cb.callCount).to.be.equal(1);
                expect(cb.firstCall.args[0]).to.be.deep.equal(row6);
            });
    });
});
