import { expect } from 'chai';
import sinon from 'sinon';
import expressBus, { publicId } from '../src/index.js';

function generateTrigger() {
    let callback = null;
    const promise = new Promise(resolve => (callback = resolve));
    return { callback, promise };
}

describe('Resolve messagebus express', () => {
    let busInstanse = null;
    const busDispose = generateTrigger();

    before(() => {
        busInstanse = expressBus({
            exchangePort: 12999,
            messageTimeout: 5000,
            serverHost: 'localhost',
            fetchAttemptTimeout: 1000,
            fetchRepeatTimeout: 2000,
            disposePromise: busDispose.promise
        });
    });

    after(() => {
        busDispose.callback();
    });

    it('should deliver events to subscribers', () => {
        const busOnReady = generateTrigger();
        const eventOneSpy = sinon.spy(busOnReady.callback);
        const eventTwoSpy = sinon.spy(busOnReady.callback);

        busInstanse.onEvent(['EVENT_ONE', 'EVENT_TWO'], eventOneSpy);
        busInstanse.onEvent(['EVENT_TWO'], eventTwoSpy);

        busInstanse.emitEvent({ _type: 'EVENT_ONE', data: 'AAA' });
        busInstanse.emitEvent({ _type: 'EVENT_TWO', data: 'BBB' });

        return busOnReady.promise.then(() => {
            expect(eventOneSpy.getCall(0).args)
                .to.be.deep.equal([{ _type: 'EVENT_ONE', data: 'AAA' }]);

            expect(eventOneSpy.getCall(1).args)
                .to.be.deep.equal([{ _type: 'EVENT_TWO', data: 'BBB' }]);

            expect(eventTwoSpy.getCall(0).args)
                .to.be.deep.equal([{ _type: 'EVENT_TWO', data: 'BBB' }]);

        });
    }).timeout(5000);
});
