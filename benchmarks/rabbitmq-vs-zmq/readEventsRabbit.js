import createBus from 'resolve-bus';
import driverRabbitmq from 'resolve-bus-rabbitmq';

import config from './config';

const busRabbitmq = createBus({ driver: driverRabbitmq({
    url: config.RABBITMQ_CONNECTION_URL
}) });

let eventsLeft = process.argv[2];
let lastEventsReported;

busRabbitmq.onEvent(['EVENT_TYPE'], () => (--eventsLeft));

function doneHandler() {
    if((eventsLeft <= 0) || (lastEventsReported === eventsLeft)) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({
            consumedEvents: process.argv[2] - eventsLeft,
            memory: process.memoryUsage()
        }));
        process.exit();
    }

    lastEventsReported = eventsLeft;
    setTimeout(doneHandler, 250);
}

setTimeout(doneHandler, 250);
