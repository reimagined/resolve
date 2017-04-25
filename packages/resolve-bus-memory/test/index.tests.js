import sinon from 'sinon';
import { expect } from 'chai';

import inMemoryBus from '../src';

describe('inMemoryBus', () => {
    it('emitEvent', () => {
        const busInstanse = inMemoryBus();

        const event1 = { __type: 'ONE', data: 'AAA' };
        const event2 = { __type: 'TWO', data: 'BBB' };

        const onEventSpy = sinon.spy();
        busInstanse.onEvent(['ONE'], onEventSpy);

        busInstanse.emitEvent(event1);
        busInstanse.emitEvent(event2);

        expect(onEventSpy.callCount).to.be.equal(1);
        expect(onEventSpy.lastCall.args[0])
            .to.be.deep.equal(event1);
    });

    it('onEvent handles all events by __type', () => {
        const busInstanse = inMemoryBus();

        const event1 = { __type: 'ONE', data: 'AAA' };
        const event2 = { __type: 'ONE', data: 'BBB' };

        const onEventSpy = sinon.spy();
        busInstanse.onEvent(['ONE'], onEventSpy);

        busInstanse.emitEvent(event1);
        busInstanse.emitEvent(event2);

        expect(onEventSpy.callCount).to.be.equal(2);
        expect(onEventSpy.lastCall.args[0])
            .to.be.deep.equal(event2);
    });

    it('emitEvent handles all subscribtions', () => {
        const busInstanse = inMemoryBus();

        const event = { __type: 'ONE', data: 'AAA' };

        const eventHandlerSpy1 = sinon.spy();
        busInstanse.onEvent(['ONE'], eventHandlerSpy1);

        const eventHandlerSpy2 = sinon.spy();
        busInstanse.onEvent(['ONE'], eventHandlerSpy2);

        busInstanse.emitEvent(event);

        expect(eventHandlerSpy1.callCount).to.be.equal(1);
        expect(eventHandlerSpy1.lastCall.args[0])
            .to.be.deep.equal(event);

        expect(eventHandlerSpy2.callCount).to.be.equal(1);
        expect(eventHandlerSpy2.lastCall.args[0])
            .to.be.deep.equal(event);
    });

    it('unsubscribe', () => {
        const busInstanse = inMemoryBus();
        const event = { __type: 'ONE', data: 'AAA' };
        const onEventSpy = sinon.spy();
        const unsubscribe = busInstanse.onEvent(['ONE'], onEventSpy);

        busInstanse.emitEvent(event);
        expect(onEventSpy.callCount).to.be.equal(1);

        unsubscribe();

        busInstanse.emitEvent(event);
        expect(onEventSpy.callCount).to.be.equal(1);
    });

    it('unsubscribe only nedded handler', () => {
        const busInstanse = inMemoryBus();
        const event = { __type: 'ONE', data: 'AAA' };

        const eventHandlerSpy1 = sinon.spy();
        busInstanse.onEvent(['ONE'], eventHandlerSpy1);

        const eventHandlerSpy2 = sinon.spy();
        const unsubscribeHandler2 = busInstanse.onEvent(['ONE'], eventHandlerSpy2);

        unsubscribeHandler2();

        busInstanse.emitEvent(event);

        expect(eventHandlerSpy1.callCount).to.be.equal(1);
        expect(eventHandlerSpy1.lastCall.args[0])
            .to.be.deep.equal(event);

        expect(eventHandlerSpy2.callCount).to.be.equal(0);
    });
});
