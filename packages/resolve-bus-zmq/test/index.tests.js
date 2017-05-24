import sinon from 'sinon';
import { expect } from 'chai';
import zeromq from 'zeromq';
import adapter from '../src';

describe('ZeroMQ bus', () => {
    let zmqSocketStub = null;
    let fakeSocketXpub = null;
    let fakeSocketXsub = null;
    let fakeSocketPub = null;
    let fakeSocketSub = null;
    let trigger = null;
    let brokerActivated = {
        pub: false,
        sub: false
    };

    const generateSocket = side => ({
        bindSync: sinon.spy(() => {
            if (brokerActivated[side]) throw new Error('Bind error');
            brokerActivated[side] = true;
        }),
        connect: sinon.spy(() => {
            if (!brokerActivated[side]) throw new Error('Connection error');
        }),
        identity: null,
        setsockopt: sinon.spy(),
        send: sinon.spy(),
        subscribe: sinon.spy(),
        on: sinon.spy()
    });

    const testOptions = {
        channel: '@@channel',
        address: '@@address',
        pubPort: '@@pubPort',
        subPort: '@@subPort'
    };

    beforeEach(() => {
        fakeSocketXpub = generateSocket('pub');
        fakeSocketXsub = generateSocket('sub');
        fakeSocketPub = generateSocket('pub');
        fakeSocketSub = generateSocket('sub');
        trigger = sinon.spy();

        zmqSocketStub = sinon.stub(zeromq, 'socket').callsFake((socktype) => {
            switch(socktype) {
                case 'xpub': return fakeSocketXpub;
                case 'xsub': return fakeSocketXsub;
                case 'pub': return fakeSocketPub;
                case 'sub': return fakeSocketSub;
                default: return null;
            }
        });
    });

    afterEach(() => {
        zmqSocketStub.restore();

        fakeSocketXpub = null;
        fakeSocketXsub = null;
        fakeSocketPub = null;
        fakeSocketSub = null;
        trigger = null;

        brokerActivated = {
            pub: false,
            sub: false
        };
    });

    it('should init correctly and run new broker', () => {
        const instance = adapter(testOptions);

        return instance.setTrigger(trigger).then(() => {
            expect(zeromq.socket.callCount).to.be.equal(4);

            expect(zeromq.socket.getCall(0).args).to.be.deep.equal(['xsub']);
            expect(fakeSocketXsub.identity).to.match(/^subscriber/);
            expect(fakeSocketXsub.bindSync.callCount).to.be.equal(1);

            expect(fakeSocketXsub.bindSync.firstCall.args).to.be.deep.equal([
                `tcp://${testOptions.address}:${testOptions.subPort}`
            ]);

            expect(zeromq.socket.getCall(1).args).to.be.deep.equal(['xpub']);
            expect(fakeSocketXpub.identity).to.match(/^publisher/);

            expect(fakeSocketXpub.setsockopt.callCount).to.be.equal(2);
            expect(fakeSocketXpub.setsockopt.firstCall.args).to.be.deep.equal([
                zeromq.ZMQ_SNDHWM, 1000
            ]);
            expect(fakeSocketXpub.setsockopt.secondCall.args).to.be.deep.equal([
                zeromq.ZMQ_XPUB_VERBOSE, 0
            ]);

            expect(fakeSocketXpub.bindSync.firstCall.args).to.be.deep.equal([
                `tcp://${testOptions.address}:${testOptions.pubPort}`
            ]);

            expect(fakeSocketXsub.on.callCount).to.be.equal(1);
            expect(fakeSocketXsub.on.firstCall.args[0]).to.be.equal('message');
            const xsubCallback = fakeSocketXsub.on.firstCall.args[1];

            expect(fakeSocketXpub.on.callCount).to.be.equal(1);
            expect(fakeSocketXpub.on.firstCall.args[0]).to.be.equal('message');
            const xpubCallback = fakeSocketXpub.on.firstCall.args[1];

            xsubCallback('xpubMarker');
            expect(fakeSocketXpub.send.callCount).to.be.greaterThan(0);
            expect(fakeSocketXpub.send.lastCall.args[0]).to.be.equal('xpubMarker');

            xpubCallback('xsubMarker');
            expect(fakeSocketXsub.send.callCount).to.be.greaterThan(0);
            expect(fakeSocketXsub.send.lastCall.args[0]).to.be.equal('xsubMarker');

            expect(zeromq.socket.getCall(2).args).to.be.deep.equal(['pub']);
            expect(fakeSocketPub.connect.callCount).to.be.equal(1);

            expect(fakeSocketPub.connect.firstCall.args).to.be.deep.equal([
                `tcp://${testOptions.address}:${testOptions.subPort}`
            ]);

            expect(zeromq.socket.getCall(3).args).to.be.deep.equal(['sub']);
            expect(fakeSocketSub.subscribe.callCount).to.be.equal(1);
            expect(fakeSocketSub.subscribe.firstCall.args).to.be.deep.equal([
                testOptions.channel
            ]);

            expect(fakeSocketSub.connect.callCount).to.be.equal(1);
            expect(fakeSocketSub.connect.firstCall.args).to.be.deep.equal([
                `tcp://${testOptions.address}:${testOptions.pubPort}`
            ]);

            expect(fakeSocketSub.on.callCount).to.be.equal(1);
            expect(fakeSocketSub.on.firstCall.args[0]).to.be.equal('message');
        });
    });

    it('should init correctly and use existing broker', () => {
        brokerActivated = { pub: true, sub: true };
        const instance = adapter(testOptions);

        return instance.setTrigger(trigger).then(() => {
            expect(zeromq.socket.callCount).to.be.equal(3);

            expect(fakeSocketXsub.bindSync.callCount).to.be.equal(1);
            expect(fakeSocketXsub.bindSync.lastCall.exception.message).to.be.equal(
                'Bind error'
            );

            expect(fakeSocketXpub.bindSync.callCount).to.be.equal(0);
            expect(fakeSocketXpub.setsockopt.callCount).to.be.equal(0);

            expect(fakeSocketXsub.on.callCount).to.be.equal(0);
            expect(fakeSocketXpub.on.callCount).to.be.equal(0);

            expect(zeromq.socket.getCall(1).args).to.be.deep.equal(['pub']);
            expect(fakeSocketPub.connect.callCount).to.be.equal(1);

            expect(fakeSocketPub.connect.firstCall.args).to.be.deep.equal([
                `tcp://${testOptions.address}:${testOptions.subPort}`
            ]);

            expect(zeromq.socket.getCall(2).args).to.be.deep.equal(['sub']);
            expect(fakeSocketSub.subscribe.callCount).to.be.equal(1);
            expect(fakeSocketSub.subscribe.firstCall.args).to.be.deep.equal([
                testOptions.channel
            ]);

            expect(fakeSocketSub.connect.callCount).to.be.equal(1);
            expect(fakeSocketSub.connect.firstCall.args).to.be.deep.equal([
                `tcp://${testOptions.address}:${testOptions.pubPort}`
            ]);

            expect(fakeSocketSub.on.callCount).to.be.equal(1);
            expect(fakeSocketSub.on.firstCall.args[0]).to.be.equal('message');
        });
    });

    it('should publish messages in bus', () => {
        brokerActivated = { pub: true, sub: true };
        const instance = adapter(testOptions);

        const originalMessage = { marker: '@@message-marker' };
        const stringMessage = JSON.stringify(originalMessage);

        return instance.publish(originalMessage).then(() => {
            expect(fakeSocketPub.send.callCount).to.be.equal(1);
            expect(fakeSocketPub.send.lastCall.args[0]).to.be.equal(
                `${testOptions.channel} ${stringMessage}`
            );
        });
    });

    it('should trigger on incoming bus messages', () => {
        brokerActivated = { pub: true, sub: true };
        const instance = adapter(testOptions);

        const originalMessage = { marker: '@@message-marker' };
        const stringMessage = JSON.stringify(originalMessage);

        return instance.setTrigger(trigger).then(() => {
            const onCallback = fakeSocketSub.on.firstCall.args[1];
            onCallback(`${testOptions.channel} ${stringMessage}`);

            expect(trigger.callCount).to.be.equal(1);
            expect(trigger.lastCall.args).to.be.deep.equal([
                originalMessage
            ])
        });
    });
});
