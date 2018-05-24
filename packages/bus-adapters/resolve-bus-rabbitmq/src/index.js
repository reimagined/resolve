import amqp from 'amqplib';

const defaultOptions = {
  exchange: 'exchange',
  queueName: '',
  channelName: '',
  exchangeType: 'fanout',
  messageTtl: 2000,
  maxLength: 10000
};

function init(
  { url, exchange, exchangeType, queueName, messageTtl, maxLength },
  handler
) {
  return amqp
    .connect(url)
    .then(connection => connection.createChannel())
    .then(channel =>
      channel
        .assertExchange(exchange, exchangeType, {
          durable: false
        })
        .then(() => channel)
    )
    .then(channel =>
      channel
        // Additional options described here:
        // http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue
        .assertQueue(queueName, {
          arguments: {
            messageTtl: messageTtl,
            maxLength: maxLength
          }
        })
        .then(queue => channel.bindQueue(queue.queue, exchange))
        .then(() =>
          channel.consume(
            queueName,
            msg => {
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

function createAdapter(options) {
  let handler = () => {};
  const config = { ...defaultOptions, ...options };
  const initPromise = init(config, event => handler(event));
  const { exchange, queueName, messageTtl } = config;

  return {
    publish: event =>
      initPromise.then(channel => {
        channel.publish(
          exchange,
          queueName,
          new Buffer(JSON.stringify(event)),
          // Additional options described here:
          // http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish
          {
            expiration: messageTtl,
            persistent: false
          }
        );
      }),
    subscribe: callback => initPromise.then(() => (handler = callback))
  };
}

export default createAdapter;
