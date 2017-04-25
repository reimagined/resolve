/* eslint no-unused-expressions: 0 */
import { expect } from 'chai';
import sinon from 'sinon';
import createBus from '../src';

describe('resolve-bus', () => {
    it('calls driver\'s emitEvent', () => {
        const fakeDriver = { emitEvent: sinon.spy() };
        const fakeEvent = { __type: 'fakeType' };
        const bus = createBus({ driver: fakeDriver });
        bus.emitEvent(fakeEvent);

        expect(fakeDriver.emitEvent.calledOnce).to.be.true;
        expect(fakeDriver.emitEvent.args[0][0]).to.be.deep.equal(fakeEvent);
    });

    it('calls driver\'s onEvent', () => {
        const fakeDriver = { onEvent: sinon.spy() };
        const fakeEventTypes = ['firstType', 'secondType'];
        const handler = () => {};
        const bus = createBus({ driver: fakeDriver });
        bus.onEvent(fakeEventTypes, handler);

        expect(fakeDriver.onEvent.calledOnce).to.be.true;
        expect(fakeDriver.onEvent.args[0][0]).to.be.deep.equal(fakeEventTypes);
        expect(fakeDriver.onEvent.args[0][1]).to.be.deep.equal(handler);
    });
});
