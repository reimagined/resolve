import sinon from 'sinon';
import { expect } from 'chai';

import inMemoryBus from '../src';

describe('inMemoryBus', () => {
    it('emitEvent', () => {
        const busInstanse = inMemoryBus();

        const event1 = { __type: 'ONE', data: 'AAA' };
        const event2 = { __type: 'TWO', data: 'BBB' };
        const event3 = { __type: 'ONE', data: 'CCC' };

        const onEventSpy = sinon.spy();
        const offEvent = busInstanse.onEvent(['ONE'], onEventSpy);

        busInstanse.emitEvent(event1);
        busInstanse.emitEvent(event2);

        expect(onEventSpy.callCount).to.be.equal(1);
        expect(onEventSpy.lastCall.args)
            .to.be.deep.equal([{ __type: 'ONE', data: 'AAA' }]);

        busInstanse.emitEvent(event3);

        expect(onEventSpy.callCount).to.be.equal(2);
        expect(onEventSpy.lastCall.args)
            .to.be.deep.equal([{ __type: 'ONE', data: 'CCC' }]);
    });

    it('unsubscribe', () => {
        const busInstanse = inMemoryBus();
        const event = { __type: 'ONE', data: 'AAA'};
        const onEventSpy = sinon.spy();
        const unsubscribe = busInstanse.onEvent(['ONE'], onEventSpy);

        busInstanse.emitEvent(event);
        expect(onEventSpy.callCount).to.be.equal(1);

        unsubscribe();

        busInstanse.emitEvent(event);
        expect(onEventSpy.callCount).to.be.equal(1);
    })
});
