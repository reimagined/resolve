import { expect } from 'chai';
import sinon from 'sinon';
import createStore from '../src/index';

const driver = {
    saveEvent: () => Promise.resolve(),
    loadEventsByTypes: sinon.spy(),
    loadEventsByAggregateId: sinon.spy()
};

const eventstore = createStore({ driver });

const event = {
    name: 'test'
};

describe('resolve-es', () => {
    it('onEventSaved called', () => {
        const cb = sinon.spy();
        eventstore.onEventSaved(cb);

        return eventstore.saveEvent(event).then(() => {
            expect(cb.callCount).to.be.equal(1);
            expect(cb.firstCall.args[0]).to.be.deep.equal(event);
        });
    });

    it('unsubscribe', () => {
        const cb = sinon.spy();
        const unsubscribe = eventstore.onEventSaved(cb);
        unsubscribe();

        return eventstore.saveEvent(event).then(() => {
            expect(cb.callCount).to.be.equal(0);
        });
    });

    it('loadEventsByTypes', () => {
        const cb = () => {};
        eventstore.loadEventsByTypes(['type'], cb);
        expect(driver.loadEventsByTypes.callCount).to.be.equal(1);
        expect(driver.loadEventsByTypes.firstCall.args).to.be.deep.equal([['type'], cb]);
    });

    it('loadEventsByAggregateId', () => {
        const cb = () => {};
        eventstore.loadEventsByAggregateId('id', cb);
        expect(driver.loadEventsByAggregateId.callCount).to.be.equal(1);
        expect(driver.loadEventsByAggregateId.firstCall.args).to.be.deep.equal(['id', cb]);
    });
});
