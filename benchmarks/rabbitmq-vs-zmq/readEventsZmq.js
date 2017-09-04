import driverZmq from 'resolve-bus-zmq';

import config from './config';

const busZmq = driverZmq({
    address: config.ZMQ_HOST,
    pubPort: config.ZMQ_PUB_PORT,
    subPort: config.ZMQ_SUB_PORT
});

let eventsLeft = process.argv[2];
let lastEventsReported;

busZmq.setTrigger(() => eventsLeft--);

function doneHandler() {
    if (eventsLeft <= 0 || lastEventsReported === eventsLeft) {
        // eslint-disable-next-line no-console
        console.log(
            JSON.stringify({
                consumedEvents: process.argv[2] - eventsLeft,
                memory: process.memoryUsage()
            })
        );
        process.exit();
    }

    lastEventsReported = eventsLeft;
    setTimeout(doneHandler, 250);
}

setTimeout(doneHandler, 250);
