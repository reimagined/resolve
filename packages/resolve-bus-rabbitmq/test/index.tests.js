import sinon from 'sinon';
import { expect } from 'chai';
import amqplib from 'amqplib';
import adapter from '../src';

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

describe('bus-rabbitmq', () => {
    let amqplibMock;
    let fakeChannelMock;
    let consumeExpectation;
    let assertExchangeExpectation;

    const adapterConfig = { url: 'url' };
    const queue = { queue: 'queue' };

    const message = {
        content: JSON.stringify({ __type: 'eventType' })
    };

    beforeEach(() => {
        amqplibMock = sinon.mock(amqplib);
        fakeChannelMock = sinon.mock(fakeChannel);

        amqplibMock
            .expects('connect')
            .withArgs(adapterConfig.url)
            .resolves(fakeConnection);

        consumeExpectation = fakeChannelMock
            .expects('consume');

        fakeChannelMock
            .expects('assertQueue')
            .withArgs('')
            .resolves(queue);

        fakeChannelMock
            .expects('bindQueue')
            .withArgs(queue.queue, 'exchange')
            .resolves();

        assertExchangeExpectation = fakeChannelMock
            .expects('assertExchange')
            .resolves();
    });

    afterEach(() => {
        amqplibMock.restore();
        fakeChannelMock.restore();
    });

    describe('emitEvent', () => {
        it('calls amqplib connect once. sequence', () => {
            const instance = adapter(adapterConfig);

            return instance.emitEvent({})
                .then(() => instance.emitEvent({}))
                .then(() => amqplibMock.verify());
        });

        it('calls amqplib publish', () => {
            const event = {};

            fakeChannelMock
                .expects('publish')
                .withArgs(
                    'exchange',
                    '',
                    new Buffer(JSON.stringify(event))
                );

            const instance = adapter(adapterConfig);

            return instance.emitEvent(event)
                .then(() => fakeChannelMock.verify());
        });

        it('calls amqplib connect once. parallel', () => {
            const instance = adapter(adapterConfig);
            const firstEvent = { message: 1 };
            const secondEvent = { message: 2 };

            fakeChannelMock
                .expects('publish')
                .onCall(0)
                .callsFake((exchange, queueName, event) => {
                    expect(new Buffer(JSON.stringify(firstEvent)))
                        .to.be.deep.equal(event);
                });

            fakeChannelMock
                .expects('publish')
                .onCall(1)
                .callsFake((exchange, queueName, event) => {
                    expect(new Buffer(JSON.stringify(secondEvent)))
                        .to.be.deep.equal(event);
                });

            return Promise.all([
                instance.emitEvent(firstEvent),
                instance.emitEvent(secondEvent)
            ])
                .then(() => {})
                .then(() => amqplibMock.verify());
        });

        it('calls amqplib bindQueue with correct arguments', () => {
            const instance = adapter(adapterConfig);

            return instance.emitEvent(message)
                .then(() => fakeChannelMock.verify());
        });

        it('calls amqplib assertExchange', () => {
            const instance = adapter(adapterConfig);

            assertExchangeExpectation
                .withArgs('exchange', 'fanout', { durable: false })
                .resolves();

            return instance.emitEvent(message)
                .then(() => fakeChannelMock.verify());
        });
    });

    describe('onEvent', () => {
        it('calls callback on message is got from amqplib', () => {
            const instance = adapter(adapterConfig);
            return new Promise((resolve, reject) => {
                instance.onEvent(['eventType'], (event) => {
                    try {
                        expect(JSON.stringify(event)).to.be.deep.equal(message.content);
                        fakeChannelMock.verify();
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });

                consumeExpectation
                    .callsFake((queueName, func, options) => {
                        expect(queueName).to.be.equal('');
                        expect(func).to.be.a('function');
                        expect(options).to.be.deep.equal({ noAck: true });
                        func(message);
                    });
            });
        });

        it(('unsubscribe'), () => {
            const instance = adapter(adapterConfig);

            const cb = sinon.spy((event) => {
                expect(JSON.stringify(event)).to.be.deep.equal(message.content);
                fakeChannelMock.verify();
            });

            const unsubscribe = instance.onEvent(['eventType'], cb);
            unsubscribe();

            return new Promise((resolve, reject) => {
                consumeExpectation
                    .callsFake((queueName, func) => {
                        try {
                            func(message);
                            expect(cb.callCount).to.be.equal(0);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
            });
        });
    });
});
