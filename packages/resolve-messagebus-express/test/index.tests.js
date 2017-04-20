import { expect } from 'chai';
import sinon from 'sinon';
import expressBus, { publicId } from '../src/index.js';

describe('Resolve messagebus express', () => {
    it('integration test', () => {
        const defaultBusConfig = {
            exchangePort: 12999,
            messageTimeout: 5000,
            serverHost: '127.0.0.1',
            fetchAttemptTimeout: 1000,
            fetchRepeatTimeout: 2000
        };

        const publicBusConfig = Object.assign({ channelName: publicId }, defaultBusConfig);
        const privateBusConfig = Object.assign({ channelName: 'channel' }, defaultBusConfig);

        const publicBus = expressBus(publicBusConfig);
        const privateBus = expressBus(privateBusConfig);

        let resolver = null;
        const promise = new Promise(resolve => (resolver = resolve));
        const eventHandlerSpy = sinon.spy(resolver);

        publicBus.onEvent(['EVENT_ONE'], eventHandlerSpy);
        publicBus.onEvent('EVENT_TWO', eventHandlerSpy);

        privateBus.onEvent('EVENT_ONE', eventHandlerSpy);
        privateBus.onEvent(['EVENT_TWO'], eventHandlerSpy);

        publicBus.emitEvent({ _type: 'EVENT_ONE', data: 'AAA' });
        publicBus.emitEvent({ _type: 'EVENT_TWO', data: 'BBB' });

        privateBus.emitEvent({ _type: 'EVENT_ONE', data: 'CCC' });
        privateBus.emitEvent({ _type: 'EVENT_TWO', data: 'DDD' });

        return promise.then(() => {
            expect(eventHandlerSpy.getCall(0).args).to.be.deep.equal(
                [ { _type: 'EVENT_ONE', data: 'AAA' } ]
            );

            expect(eventHandlerSpy.getCall(1).args).to.be.deep.equal(
                [ { _type: 'EVENT_TWO', data: 'BBB' } ]
            );

            expect(eventHandlerSpy.getCall(2).args).to.be.deep.equal(
                [ { _type: 'EVENT_ONE', data: 'AAA' } ]
            );

            expect(eventHandlerSpy.getCall(3).args).to.be.deep.equal(
                [ { _type: 'EVENT_TWO', data: 'BBB' } ]
            );

            expect(eventHandlerSpy.getCall(4).args).to.be.deep.equal(
                [ { _type: 'EVENT_ONE', data: 'CCC' } ]
            );

            expect(eventHandlerSpy.getCall(5).args).to.be.deep.equal(
                [ { _type: 'EVENT_TWO', data: 'DDD' } ]
            );

            publicBus.dispose();
            privateBus.dispose();
        }).catch(() => {
            publicBus.dispose();
            privateBus.dispose();
        });
    }).timeout(5000);
});
