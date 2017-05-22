import createBus from 'resolve-bus';
import driverZmq from 'resolve-bus-zmq';

import config from './config';

const busZmq = createBus({ driver: driverZmq({
    address: config.ZMQ_HOST,
    pubPort: config.ZMQ_PUB_PORT,
    subPort: config.ZMQ_SUB_PORT
}) });

let eventsLeft = process.argv[2];

busZmq.onEvent(['EVENT_TYPE'], () => (eventsLeft--));

function doneHandler() {
    if(eventsLeft <= 0) {
        console.log(JSON.stringify({
            memory: process.memoryUsage()
        }));

        process.exit();
        return;
    }

    setTimeout(doneHandler, 250);
}

setTimeout(doneHandler, 250);
