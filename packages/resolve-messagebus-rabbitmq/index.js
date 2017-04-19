import amqp from 'amqplib';

const config = {
    exchange: 'exchange',
    queueName: '',
    channelName: '',
    globalId: '$global'
};

function getPublisher(data) {
    return event =>
        Promise.resolve()
            .then(() => (data.isInited ? null : data.init()))
            .then(() =>
                data.channel.publish(
                    config.exchange,
                    config.queueName,
                    new Buffer(JSON.stringify(event))
                )
            );
}

function createTrigger(callbackStore) {
    return (message) => {
        const handlers = callbackStore[message.type] || [];
        handlers.forEach(handler => handler(message));
    };
}

function getSubscriber(data) {
    return (eventTypes, callback) => (
        Promise
            .resolve()
            .then(() =>
                eventTypes.forEach((eventType) => {
                    data.callbacks[eventType] = data.callbacks[eventType] || [];
                    data.callbacks[eventType].push(callback);
                })
            )
            .then(() => (data.isInited ? null : data.init()))
    );
}

function createData() {
    return {
        channel: null,
        trigger: null,
        callbacks: {},
        isInited: false
    };
}

function init(data, options) {
    data.trigger = createTrigger(data.callbacks);

    return amqp
        .connect(options.url)
        .then(connection => connection.createChannel())
        .then(channel => (data.channel = channel))
        .then(channel =>
            channel.assertQueue(config.queueName)
                .then(queue => channel.bindQueue(queue.queue, config.exchange))
                .then(() => channel.consume(config.queueName, (msg) => {
                    if (msg) {
                        const content = msg.content.toString();
                        const message = JSON.parse(content);
                        data.trigger(message);
                    }
                }, { noAck: true }))
        )
        .then(() => {
            data.isInited = true;
        });
}

export default function (options) {
    const data = createData();
    data.init = init.bind(null, data, options);

    return {
        emitEvent: getPublisher(data),
        onEvent: getSubscriber(data)
    };
}
