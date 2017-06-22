#!/usr/bin/env node
const yargs = require('yargs');
const createTestCafe = require('testcafe');
const { getInstallations } = require('testcafe-browser-tools');
const DELAY = 10000;
let testcafe = null;

const argv = yargs
    .option('browser', {
        alias: 'b',
        default: false
    })
    .help().argv;

getInstallations().then(browsers =>
    createTestCafe('localhost', 1337, 1338)
        .then((tc) => {
            testcafe = tc;
            const runner = testcafe.createRunner();
            const browser = argv.browser || Object.keys(browsers).slice(0, 1);
            return runner
                .startApp('npm run start', DELAY)
                .src(['./testcafe/index.tests.js'])
                .browsers(browser)
                .run();
        })
        .then((exitCode) => {
            testcafe.close();
            process.exit(exitCode);
        })
);
