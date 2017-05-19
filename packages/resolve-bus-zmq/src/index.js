import zeromq from 'zeromq';

const defaultOptions = {
    url: 'tcp://127.0.0.1:2110'
};

function init(options, trigger) {
    return Promise.reject()
        .catch(() => {
            const busSocket = zeromq.socket('push');
            busSocket.bindSync(options.url);
            return busSocket;
        })
        .catch(() => {
            const busSocket = zeromq.socket('pull');
            busSocket.connect(options.url);
            return busSocket;
        })
        .catch(() => null)
        .then((busSocket) => {
            if (!busSocket) return null;
            busSocket.on('message', trigger);
            return busSocket;
        });
}

export default function (options) {
    let handler = () => {};
    const config = Object.assign({}, defaultOptions, options);
    const initPromise = init(config, event => handler(event));

    return {
        publish: event =>
            initPromise.then(channel =>
                channel.send(JSON.stringify(event))
            ),
        setTrigger: callback =>
            initPromise.then(() =>
                (handler = callback)
            )
    };
}
