import amqp from 'amqplib';

const defaultOptions = {
    exchange: 'exchange',
    queueName: '',
    channelName: '',
    exchangeType: 'fanout'
};

function createTrigger(callbackStore) {
    return (message) => {
        const handlers = callbackStore[message.type] || [];
        handlers.forEach(handler => handler(message));
    };
}

function init(options, callbacks) {
    const trigger = createTrigger(callbacks);

    return amqp
        .connect(options.url)
        .then(connection => connection.createChannel())
        .then(channel =>
            channel.assertExchange(options.exchange, options.exchangeType, { durable: false })
                .then(() => channel)
            )
        .then(channel =>
            channel.assertQueue(options.queueName)
                .then(queue => channel.bindQueue(queue.queue, options.exchange))
                .then(() => channel.consume(options.queueName, (msg) => {
                    if (msg) {
                        const content = msg.content.toString();
                        const message = JSON.parse(content);
                        trigger(message);
                    }
                }, { noAck: true }))
                .then(() => channel)
        );
}

export default function (options) {
    const callbacks = {};
    const config = Object.assign(defaultOptions, options);

    let promise;

    function getChannel() {
        if (!promise) {
            promise = init(config, callbacks);
        }
        return promise;
    }

    return {
        emitEvent: event =>
            getChannel()
                .then((channel) => {
                    channel.publish(
                        config.exchange,
                        config.queueName,
                        new Buffer(JSON.stringify(event))
                    );
                }),
        onEvent: (eventTypes, callback) =>
            getChannel()
                    .then(() => {
                        eventTypes.forEach((eventType) => {
                            callbacks[eventType] = callbacks[eventType] || [];
                            callbacks[eventType].push(callback);
                        });
                    })
    };
}
