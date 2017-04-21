const bodyParser = require('body-parser');
const express = require('express');
const MID = require('monotonic-id');

const CONSUMER_EXCHANGE_TCP_PORT = process.argv[2] || 12999;
const MESSAGE_EXPIRATION_TIMEOUT = process.argv[3] || 5000; // 5 seconds

const jsonBodyParser = bodyParser.json();
const messages = new Map();

const server = express();

server.get('/getMessages', (req, res) => {
    const result = [];

    // ECMA-262 Ver 6.0 Sec 23.1.3.5 Item 7 guarantees original key insertion order
    messages.forEach((message, messageId) =>
        result.push(Object.assign({ messageId }, message))
    );

    res.json(result);
});

server.post('/postMessage', [jsonBodyParser, (req, res) => {
    const messageId = (new MID()).toString('hex');
    messages.set(messageId, req.body);

    // Comsumer process have litimed time to get messages from bus
    // after recieve system signal - it's most straightforward solution
    // for notification with memory economy together
    setTimeout(
        () => messages.delete(messageId),
        MESSAGE_EXPIRATION_TIMEOUT
    );

    res.json({ ok: 'ok' });
}]);

server.listen(CONSUMER_EXCHANGE_TCP_PORT);
