import zmq from 'zeromq';

const defaultOptions = {
    channel: 'DEFAULT',
    address: '127.0.0.1',
    pubPort: 2110,
    subPort: 2111
};

function runBroker({ address, pubPort, subPort }) {
    const pubListener = `tcp://${address}:${pubPort}`;
    const subListener = `tcp://${address}:${subPort}`;
    const hwm = 1000;
    const verbose = 0;

    const subSock = zmq.socket('xsub');
    subSock.identity = `subscriber${process.pid}`;
    subSock.bindSync(subListener);

    const pubSock = zmq.socket('xpub');
    pubSock.identity = `publisher${process.pid}`;
    pubSock.setsockopt(zmq.ZMQ_SNDHWM, hwm);
    pubSock.setsockopt(zmq.ZMQ_XPUB_VERBOSE, verbose);
    pubSock.bindSync(pubListener);

    subSock.on('message', data => pubSock.send(data));
    pubSock.on('message', data => subSock.send(data));
}

function getPublisher({ address, subPort, channel }) {
    const sock = zmq.socket('pub');
    sock.connect(`tcp://${address}:${subPort}`);
    return (event) => {
        const message = `${channel} ${event}`;
        sock.send(message);
    };
}

function buildConsumer({ address, pubPort, channel }, trigger) {
    const sock = zmq.socket('sub');
    sock.subscribe(channel);
    sock.connect(`tcp://${address}:${pubPort}`);
    sock.on('message', (message) => {
        const data = message.toString().substring(channel.length + 1);
        trigger(JSON.parse(data));
    });
}

function init(options, trigger) {
    return Promise.resolve()
        .then(() => runBroker(options))
        .catch(err => err) // Broken may not run if already started
        .then(() => {
            const publisher = getPublisher(options);
            buildConsumer(options, trigger);
            return { publisher };
        });
}

export default function (options) {
    let handler = () => {};
    const config = Object.assign({}, defaultOptions, options);
    const initPromise = init(config, event => handler(event));

    return {
        publish: event =>
            initPromise.then(({ publisher }) =>
                publisher(JSON.stringify(event))
            ),
        setTrigger: callback =>
            initPromise.then(() =>
                (handler = callback)
            )
    };
}
