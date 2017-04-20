import sinon from 'sinon';
import { expect } from 'chai';
import amqplib from 'amqplib';
import adapter from '../index';

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

describe('messagebus-rabbitmq', () => {
    let amqplibMock;
    let fakeChannelMock;
    let consumeExpectation;
    let assertExchangeExpectation;

    const adapterConfig = { url: 'url' };
    const queue = { queue: 'queue' };

    const message = {
        content: JSON.stringify({ type: 'eventType' })
    };

    beforeEach(() => {
        amqplibMock = sinon.mock(amqplib);
        fakeChannelMock = sinon.mock(fakeChannel);

        amqplibMock
            .expects('connect')
            .withArgs(adapterConfig.url)
            .resolves(fakeConnection);

        consumeExpectation = fakeChannelMock
            .expects('consume')
            .callsArgWith(1, message);

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
        it('calls amqplib connect once', () => {
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
    });

    describe('onEvent', () => {
        it('calls amqplib connect only once', () => {
            const instance = adapter(adapterConfig);

            return instance.onEvent(['eventType'], () => {})
                .then(() => instance.onEvent(['eventType'], () => {}))
                .then(() => amqplibMock.verify());
        });

        it('calls callback on message is got from amqplib', (done) => {
            const instance = adapter(adapterConfig);

            consumeExpectation
                .callsFake((queueName, func, options) => {
                    expect(queueName).to.be.equal('');
                    expect(func).to.be.a('function');
                    expect(options).to.be.deep.equal({ noAck: true });
                });

            instance.onEvent(['eventType'], (event) => {
                expect(JSON.stringify(event)).to.be.deep.equal(message.content);
                fakeChannelMock.verify();
                done();
            })
                .catch(error => done(error));
        });

        it('calls amqplib bindQueue with correct arguments', (done) => {
            const instance = adapter(adapterConfig);

            instance.onEvent(['eventType'], (event) => {
                expect(JSON.stringify(event)).to.be.deep.equal(message.content);
                fakeChannelMock.verify();
                done();
            });
        });

        it('calls amqplib assertExchange', (done) => {
            const instance = adapter(adapterConfig);
            assertExchangeExpectation
                 .callsFake((exchange, type, options) => {
                     expect(exchange).to.be.equal('exchange');
                     expect(type).to.be.equal('fanout');
                     expect(options).to.be.deep.equal({ durable: false });
                     return Promise.resolve();
                 });


            instance.onEvent(['eventType'], () => {
                fakeChannelMock.verify();
                done();
            })
                .catch(error => done(error));
        });
    });
});
