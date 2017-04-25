import { expect } from 'chai';
import sinon from 'sinon';
import createStore from '../src/index';

const eventstore = createStore({
    saveEvent: () => Promise.resolve()
});

const event = {
    name: 'test'
};

describe('resolve-es', () => {
    it('onEventSaved called', () => {
        const cb = sinon.spy();
        eventstore.onEventSaved(cb);

        return eventstore
            .saveEvent(event)
            .then(() => {
                expect(cb.callCount).to.be.equal(1);
                expect(cb.firstCall.args[0]).to.be.deep.equal(event);
            });
    });
});
