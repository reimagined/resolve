import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import driverRabbitmq from 'resolve-bus-rabbitmq';
import driverZmq from 'resolve-bus-zmq';

import config from './config';

const { BENCHMARK_SERIES, FREEING_TIME } = config;

const busRabbitmq = driverRabbitmq({
    url: config.RABBITMQ_CONNECTION_URL,
    messageTtl: 20000
});

const busZmq = driverZmq({
    address: config.ZMQ_HOST,
    pubPort: config.ZMQ_PUB_PORT,
    subPort: config.ZMQ_SUB_PORT
});

function getRabbitmqHelper(eventCount) {
    return {
        launcher: () =>
            spawn('babel-node', [path.join(__dirname, './readEventsRabbit'), eventCount]),
        emitter: event => busRabbitmq.emitEvent(event),
        eventCount
    };
}

function getZmqHelper(eventCount) {
    return {
        launcher: () => spawn('babel-node', [path.join(__dirname, './readEventsZmq'), eventCount]),
        emitter: event => busZmq.emitEvent(event),
        eventCount
    };
}

function generateEvent() {
    return {
        type: 'EVENT_TYPE',
        payload: {}
    };
}

function delay(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout));
}

function runLoadTests({ launcher, emitter, eventCount }) {
    const child = launcher();
    const initialTime = +new Date();
    let remainEvents = eventCount;
    let consoleInfo = '';

    let resolver;
    const done = new Promise(resolve => (resolver = resolve));

    const logHandler = rawData => (consoleInfo += rawData.toString('utf8'));

    const doneHandler = () => {
        const workTime = +new Date() - initialTime;
        const passedInfo = JSON.parse(consoleInfo);
        resolver({ ...passedInfo, time: workTime });
    };

    child.stdout.on('data', logHandler);
    child.stderr.on('data', logHandler);
    child.on('exit', doneHandler);

    const produceEventsAsync = () => {
        if (remainEvents-- <= 0) return;
        emitter(generateEvent());
        setImmediate(produceEventsAsync);
    };

    produceEventsAsync();
    return done;
}

function fsWriteFileAsync(filename, content) {
    return new Promise((resolve, reject) =>
        fs.writeFile(filename, content, (err, value) => (!err ? resolve(value) : reject(err)))
    );
}

function generateEvents(arr, i, storage) {
    const eventCount = arr[i];

    return runLoadTests(getRabbitmqHelper(eventCount))
        .then(rabbit =>
            delay(FREEING_TIME)
                .then(() => runLoadTests(getZmqHelper(eventCount)))
                .then(zmq => (storage[eventCount] = { rabbit, zmq }))
        )
        .then(
            () =>
                i < arr.length - 1
                    ? delay(FREEING_TIME).then(() => generateEvents(arr, i + 1, storage))
                    : storage
        );
}

generateEvents(BENCHMARK_SERIES, 0, {})
    .then(result => fsWriteFileAsync('./result.json', JSON.stringify(result)))
    .then(() => process.exit(0))
    .catch((err) => {
        // eslint-disable-next-line no-console
        console.log(err);
        process.exit(1);
    });
