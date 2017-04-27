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

    it('publish handles subscription', () => {
        const busInstance = inMemoryBus();
        const event = { __type: 'ONE', data: 'AAA' };

        const eventHandlerSpy = sinon.spy();
        busInstance.subscribe(eventHandlerSpy);

        busInstance.publish(event);

        expect(eventHandlerSpy.callCount).to.be.equal(1);

        expect(eventHandlerSpy.lastCall.args[0]).to.be.deep.equal(event);
    });
});
