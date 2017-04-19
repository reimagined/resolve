const bodyParser = require('body-parser');
const express = require('express');
const MID = require('monotonic-id');

const CONSUMER_EXCHANGE_TCP_PORT = process.argv[2] || 12999;
const MESSAGE_EXPIRATION_TIMEOUT = process.argv[3] || 5000; // 5 seconds

const jsonBodyParser = bodyParser.json();
const messages = new Map();

const server = express();

server.get('/getMessages', (req, res) => {
    const result = Array.from(messages)
        .sort(([messageIdLeft], [messageIdRight]) =>
            ((messageIdLeft < messageIdRight) ? -1 : 1)
        )
        .map(([messageId, message]) =>
            Object.assign({ messageId }, message)
        );

    res.json(result);
    res.end();
});

server.post('/postMessage', [jsonBodyParser, (req, res) => {
    const messageId = (new MID()).toString('hex');
    messages.set(messageId, Object.assign({ messageId }, req.body));
    // Comsumer process have litimed time to get messages from bus
    // after recieve system signal - it's most straightforward solution
    // for notification with memory economy together
    setTimeout(
        () => messages.delete(messageId),
        MESSAGE_EXPIRATION_TIMEOUT
    );

    res.json({ ok: 'ok' });
    res.end();
}]);

server.listen(CONSUMER_EXCHANGE_TCP_PORT);
