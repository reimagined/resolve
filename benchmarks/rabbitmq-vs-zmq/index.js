import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import createBus from 'resolve-bus';
import driverRabbitmq from 'resolve-bus-rabbitmq';
import driverZmq from 'resolve-bus-zmq';

import config from './config';

const POINTS = config.BENCHMARK_SERIES;

const busRabbitmq = createBus({ driver: driverRabbitmq({
    url: config.RABBITMQ_CONNECTION_URL
}) });

const busZmq = createBus({ driver: driverZmq({
    address: config.ZMQ_HOST,
    pubPort: config.ZMQ_PUB_PORT,
    subPort: config.ZMQ_SUB_PORT
}) });

function getRabbitmqHelper(eventCount) {
    return {
        spawner: spawn('babel-node', [path.join(__dirname, './readEventsRabbit'), eventCount]),
        emitter: event => busRabbitmq.emitEvent(event)
    };
}

function getZmqHelper(eventCount) {
    return {
        spawner: spawn('babel-node', [path.join(__dirname, './readEventsZmq'), eventCount]),
        emitter: event => busZmq.emitEvent(event)
    };
}

function generateEvent() {
    return {
        type: 'EVENT_TYPE',
        payload: {}
    };
}

function runLoadTests(helper) {
    const child = helper.launcher();
    const initialTime = +new Date();
    let consoleInfo = '';
    let isDone = false;

    let resolver;
    const done = new Promise((resolve, reject) => (resolver = resolve));

    const logHandler = rawData => (consoleInfo += rawData.toString('utf8'));

    const doneHandler = () => {
        const workTime = +new Date() - initialTime;
        const passedInfo = JSON.parse(consoleInfo);
        resolver({ ...passedInfo, time: workTime });
        isDone = true;
    };

    child.stdout.on('data', logHandler);
    child.stderr.on('data', logHandler);
    child.on('exit', doneHandler);

    const produceEventsAsync = () => {
        if (isDone) return;
        helper.emitter(generateEvent());
        setImmediate(produceEventsAsync);
    }

    produceEventsAsync();
    return done;
}

function fsWriteFileAsync(filename, content) {
    return new Promise((resolve, reject) =>
        fs.writeFile(filename, content, (err, value) => (
            !err ? resolve(value) : reject(err)
        ))
    );
}

function generateEvents(arr, i, storage) {
    const eventCount = arr[i];

    return runLoadTests(getRabbitmqHelper(eventCount))
        .then(rabbit => runLoadTests(getZmqHelper(eventCount))
            .then(zmq => (storage[eventCount] = { rabbit, zmq }))
        )
        .then(() => (i < arr.length - 1)
            ? generateEvents(arr, i + 1, storage)
            : storage
        );
}

generateEvents(POINTS, 0, {})
    .then(result => fsWriteFileAsync('./result.json', JSON.stringify(result)))
    .then(() => process.exit(0))
    .catch((err) => {
        // eslint-disable-next-line no-console
        console.log(err);
        process.exit(1);
    });
