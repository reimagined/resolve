import amqp from 'amqplib';

const defaultOptions = {
    exchange: 'exchange',
    queueName: '',
    channelName: '',
    exchangeType: 'fanout'
};

function init(options, callbacks) {
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
                        callbacks.forEach(callback => callback(message));
                    }
                }, { noAck: true }))
                .then(() => channel)
        );
}

export default function (options) {
    const callbacks = [];
    const config = Object.assign(defaultOptions, options);
    const initPromise = init(config, callbacks);

    return {
        publish: event =>
            initPromise
                .then((channel) => {
                    channel.publish(
                        config.exchange,
                        config.queueName,
                        new Buffer(JSON.stringify(event))
                    );
                }),
        subscribe: callback =>
            initPromise
                .then(() => callbacks.push(callback))
    };
}
