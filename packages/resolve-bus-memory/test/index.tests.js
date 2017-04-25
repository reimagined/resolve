import sinon from 'sinon';
import { expect } from 'chai';

import inMemoryBus from '../src';

describe('inMemoryBus', () => {
    it('publish', () => {
        const busInstance = inMemoryBus();

        const event1 = { __type: 'ONE', data: 'AAA' };
        const event2 = { __type: 'TWO', data: 'BBB' };

        const subscribeSpy = sinon.spy();
        busInstance.subscribe(subscribeSpy);

        busInstance.publish(event1);
        busInstance.publish(event2);

        expect(subscribeSpy.callCount).to.be.equal(2);
        expect(subscribeSpy.args[0][0]).to.be.deep.equal(event1);
        expect(subscribeSpy.args[1][0]).to.be.deep.equal(event2);
    });

    it('subscribe handles all events by __type', () => {
        const busInstance = inMemoryBus();

        const event1 = { __type: 'ONE', data: 'AAA' };
        const event2 = { __type: 'ONE', data: 'BBB' };

        const subscribeSpy = sinon.spy();
        busInstance.subscribe(subscribeSpy);

        busInstance.publish(event1);
        busInstance.publish(event2);

        expect(subscribeSpy.callCount).to.be.equal(2);
        expect(subscribeSpy.lastCall.args[0])
            .to.be.deep.equal(event2);
    });

    it('publish handles all subscribtions', () => {
        const busInstance = inMemoryBus();

        const event = { __type: 'ONE', data: 'AAA' };

        const eventHandlerSpy1 = sinon.spy();
        busInstance.subscribe(eventHandlerSpy1);

        const eventHandlerSpy2 = sinon.spy();
        busInstance.subscribe(eventHandlerSpy2);

        busInstance.publish(event);

        expect(eventHandlerSpy1.callCount).to.be.equal(1);
        expect(eventHandlerSpy1.lastCall.args[0])
            .to.be.deep.equal(event);

        expect(eventHandlerSpy2.callCount).to.be.equal(1);
        expect(eventHandlerSpy2.lastCall.args[0])
            .to.be.deep.equal(event);
    });

    it('unsubscribe', () => {
        const busInstance = inMemoryBus();
        const event = { __type: 'ONE', data: 'AAA' };
        const subscribeSpy = sinon.spy();
        const unsubscribe = busInstance.subscribe(subscribeSpy);

        busInstance.publish(event);
        expect(subscribeSpy.callCount).to.be.equal(1);

        unsubscribe();

        busInstance.publish(event);
        expect(subscribeSpy.callCount).to.be.equal(1);
    });

    it('unsubscribe only nedded handler', () => {
        const busInstance = inMemoryBus();
        const event = { __type: 'ONE', data: 'AAA' };

        const eventHandlerSpy1 = sinon.spy();
        busInstance.subscribe(eventHandlerSpy1);

        const eventHandlerSpy2 = sinon.spy();
        const unsubscribeHandler2 = busInstance.subscribe(eventHandlerSpy2);

        unsubscribeHandler2();

        busInstance.publish(event);

        expect(eventHandlerSpy1.callCount).to.be.equal(1);

        expect(
            eventHandlerSpy1.lastCall.args[0]
        ).to.be.deep.equal(event);

        expect(eventHandlerSpy2.callCount).to.be.equal(0);
    });
});
