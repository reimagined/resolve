import amqp from 'amqplib';

const config = {
    exchange: 'exchange',
    queueName: '',
    channelName: '',
    globalId: '$global'
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
            channel.assertExchange(config.exchange, 'fanout', { durable: false })
                .then(() => channel)
            )
        .then(channel =>
            channel.assertQueue(config.queueName)
                .then(queue => channel.bindQueue(queue.queue, config.exchange))
                .then(() => channel.consume(config.queueName, (msg) => {
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

    let promise;

    function getChannel() {
        if (!promise) {
            promise = init(options, callbacks);
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
