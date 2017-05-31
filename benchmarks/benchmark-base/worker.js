import { INFO_TOKEN, DONE_TOKEN, ERR_TOKEN } from './constants';

// eslint-disable-next-line no-console
const log = console.log;

function mainWorker() {
    const counterObj = { value: 0 };
    let lastReported = 0;

    const workerModule = process.argv[2];
    const quantity = process.argv[3];

    const worker = (...args) => require(workerModule)(...args);

    function reporterHandler() {
        if (lastReported !== counterObj.value) {
            const tickSize = counterObj.value - lastReported;
            log(INFO_TOKEN, tickSize);
            lastReported = counterObj.value;
        }

        setTimeout(reporterHandler, 500);
    }

    setTimeout(reporterHandler, 500);

    return worker(quantity, counterObj);
}

Promise.resolve()
    .then(mainWorker)
    .then(report =>
        log(
            DONE_TOKEN,
            JSON.stringify({
                memory: process.memoryUsage(),
                report
            })
        )
    )
    .catch(err => log(ERR_TOKEN, err));
