import amqp from 'amqplib';

const defaultOptions = {
    exchange: 'exchange',
    queueName: '',
    channelName: '',
    exchangeType: 'fanout',
    messageTtl: 2000,
    maxLength: 10000
};

function init(options, handler) {
    return amqp
        .connect(options.url)
        .then(connection => connection.createChannel())
        .then(channel =>
            channel
                .assertExchange(options.exchange, options.exchangeType, {
                    durable: false
                })
                .then(() => channel)
        )
        .then(channel =>
            channel
                // Additional options described here:
                // http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue
                .assertQueue(options.queueName, {
                    arguments: {
                        messageTtl: options.messageTtl,
                        maxLength: options.maxLength
                    }
                })
                .then(queue => channel.bindQueue(queue.queue, options.exchange))
                .then(() =>
                    channel.consume(
                        options.queueName,
                        (msg) => {
                            if (msg) {
                                const content = msg.content.toString();
                                const message = JSON.parse(content);
                                handler(message);
                            }
                        },
                        { noAck: true }
                    )
                )
                .then(() => channel)
        );
}

export default function (options) {
    let handler = () => {};
    const config = Object.assign(defaultOptions, options);
    const initPromise = init(config, event => handler(event));

    return {
        publish: event =>
            initPromise.then((channel) => {
                channel.publish(
                    config.exchange,
                    config.queueName,
                    new Buffer(JSON.stringify(event)),
                    // Additional options described here:
                    // http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish
                    {
                        expiration: config.messageTtl,
                        persistent: false
                    }
                );
            }),
        setTrigger: callback => initPromise.then(() =>
            (handler = callback)
        )
    };
}
