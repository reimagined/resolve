/* eslint no-unused-expressions: 0 */
import { expect } from 'chai';
import sinon from 'sinon';
import createBus from '../src';

describe('resolve-bus', () => {
    let driver;

    beforeEach(() => {
        driver = {
            publish: sinon.spy(),
            subscribe: sinon.spy()
        };
    });

    it('passes handler to adapter', () => {
        createBus(driver);
        expect(driver.subscribe.calledOnce).to.be.true;
        expect(driver.subscribe.args[0][0]).to.be.a('function');
    });

    it('emitEvent calls driver\'s publish', () => {
        const fakeEvent = { __type: 'fakeType' };
        const bus = createBus(driver);
        bus.emitEvent(fakeEvent);

        expect(driver.publish.calledOnce).to.be.true;
        expect(driver.publish.args[0][0]).to.be.deep.equal(fakeEvent);
    });

    it('calls onEvent handler if subscribe on type', (done) => {
        const bus = createBus(driver);

        const fakeEventTypes = ['firstType', 'secondType'];
        const fakeEvent = { __type: 'secondType' };

        bus.onEvent(fakeEventTypes, (event) => {
            expect(event).to.be.deep.equal(fakeEvent);
            done();
        });

        driver.subscribe.args[0][0](fakeEvent);
    });
});
