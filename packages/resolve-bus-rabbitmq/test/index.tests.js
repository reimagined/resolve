import sinon from 'sinon';
import { expect } from 'chai';
import amqplib from 'amqplib';
import driver from '../src';

const fakeChannel = {
    publish: () => {},
    consume: () => {},
    bindQueue: () => {},
    assertQueue: () => {},
    assertExchange: () => {}
};

const fakeConnection = {
    createChannel: () => fakeChannel
};

describe('RabbitMQ bus', () => {
    let amqplibMock;
    let fakeChannelMock;
    let consumeExpectation;
    let assertExchangeExpectation;

    const driverConfig = { url: 'url', messageTtl: 'messageTtl', maxLength: 'maxLength' };
    const queue = { queue: 'queue' };

    const queueConfig = {
        arguments: {
            messageTtl: driverConfig.messageTtl,
            maxLength: driverConfig.maxLength
        }
    };

    const message = {
        content: JSON.stringify({ type: 'eventType' })
    };

    beforeEach(() => {
        amqplibMock = sinon.mock(amqplib);
        fakeChannelMock = sinon.mock(fakeChannel);

        amqplibMock.expects('connect').withArgs(driverConfig.url).resolves(fakeConnection);

        consumeExpectation = fakeChannelMock.expects('consume');

        fakeChannelMock.expects('assertQueue').withArgs('', queueConfig).resolves(queue);

        fakeChannelMock.expects('bindQueue').withArgs(queue.queue, 'exchange').resolves();

        assertExchangeExpectation = fakeChannelMock.expects('assertExchange').resolves();
    });

    afterEach(() => {
        amqplibMock.restore();
        fakeChannelMock.restore();
    });

    describe('publish', () => {
        it('calls amqplib connect once', () => {
            const instance = driver(driverConfig);

            return instance
                .publish({})
                .then(() => instance.publish({}))
                .then(() => amqplibMock.verify());
        });

        it('calls amqplib publish', () => {
            const event = {};

            fakeChannelMock
                .expects('publish')
                .withArgs('exchange', '', new Buffer(JSON.stringify(event)));

            const instance = driver(driverConfig);

            return instance.publish(event).then(() => fakeChannelMock.verify());
        });

        it('calls amqplib connect once in parallel', () => {
            const instance = driver(driverConfig);
            const firstEvent = { message: 1 };
            const secondEvent = { message: 2 };

            fakeChannelMock
                .expects('publish')
                .onCall(0)
                .callsFake((exchange, queueName, event, options) => {
                    expect(new Buffer(JSON.stringify(firstEvent))).to.be.deep.equal(event);
                    expect(options).to.be.deep.equal({
                        expiration: driverConfig.messageTtl,
                        persistent: false
                    });
                });

            fakeChannelMock
                .expects('publish')
                .onCall(1)
                .callsFake((exchange, queueName, event, options) => {
                    expect(new Buffer(JSON.stringify(secondEvent))).to.be.deep.equal(event);
                    expect(options).to.be.deep.equal({
                        expiration: driverConfig.messageTtl,
                        persistent: false
                    });
                });

            return Promise.all([
                instance.publish(firstEvent),
                instance.publish(secondEvent)
            ]).then(() => amqplibMock.verify());
        });
    });

    describe('onEvent', () => {
        it('calls amqplib connect only once in sequence', () => {
            const instance = driver(driverConfig);

            return instance
                .setTrigger(() => {})
                .then(() => instance.setTrigger(['eventType'], () => {}))
                .then(() => amqplibMock.verify());
        });

        it('calls callback on message is got from amqplib', () => {
            const instance = driver(driverConfig);
            let emitter;

            consumeExpectation.callsFake((queueName, func, options) => {
                expect(queueName).to.be.equal('');
                expect(func).to.be.a('function');
                expect(options).to.be.deep.equal({ noAck: true });
                emitter = func;
            });

            return instance
                .setTrigger((event) => {
                    expect(JSON.stringify(event)).to.be.deep.equal(message.content);
                    fakeChannelMock.verify();
                })
                .then(() => emitter(message));
        });

        it('calls amqplib bindQueue with correct arguments', () => {
            const instance = driver(driverConfig);

            return instance
                .setTrigger(['eventType'], () => {})
                .then(() => fakeChannelMock.verify());
        });

        it('calls amqplib assertExchange', () => {
            const instance = driver(driverConfig);

            assertExchangeExpectation.withArgs('exchange', 'fanout', { durable: false }).resolves();

            return instance.setTrigger(() => {}).then(() => fakeChannelMock.verify());
        });
    });

    it('works the same way for different import types', () => {
        expect(driver).to.be.equal(require('../src'));
    });
});
