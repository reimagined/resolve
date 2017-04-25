/* eslint no-unused-expressions: 0 */
import { expect } from 'chai';
import sinon from 'sinon';
import createBus from '../src';

describe('resolve-bus', () => {
    let driver;
    let driverInstance;

    beforeEach(() => {
        driver = sinon.spy(() => {
            driverInstance = {
                publish: sinon.spy(),
                subscribe: sinon.spy()
            };

            return driverInstance;
        });
    });

    it('creates correct adapter instance', () => {
        const options = { a: 1, b: '2' };
        createBus(driver, options);
        expect(driver.calledOnce).to.be.true;
        expect(driver.args[0][0]).to.be.deep.equal(options);
    });

    it('passes handler to adapter', () => {
        createBus(driver);
        expect(driverInstance.subscribe.calledOnce).to.be.true;
        expect(driverInstance.subscribe.args[0][0]).to.be.a('function');
    });

    it('emitEvent calls driver\'s publish', () => {
        const fakeEvent = { __type: 'fakeType' };
        const bus = createBus(driver);
        bus.emitEvent(fakeEvent);

        expect(driverInstance.publish.calledOnce).to.be.true;
        expect(driverInstance.publish.args[0][0]).to.be.deep.equal(fakeEvent);
    });

    it('calls onEvent handler if subscribe on type', (done) => {
        const bus = createBus(driver);

        const fakeEventTypes = ['firstType', 'secondType'];
        const fakeEvent = { __type: 'secondType' };

        bus.onEvent(fakeEventTypes, (event) => {
            expect(event).to.be.deep.equal(fakeEvent);
            done();
        });

        driverInstance.subscribe.args[0][0](fakeEvent);
    });
});
