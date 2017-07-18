#!/usr/bin/env node
const yargs = require('yargs');
const createTestCafe = require('testcafe');
const { getInstallations } = require('testcafe-browser-tools');
const fs = require('fs');
const config = require('../../resolve.config');
const DELAY = 10000;
let testcafe = null;

const argv = yargs.option('browser', {
    alias: 'b',
    default: false
}).help().argv

getInstallations()
    .then((browsers) => {
        createTestCafe('localhost', 1337, 1338)
            .then((tc) => {
                testcafe = tc;
                const runner = testcafe.createRunner();
                const browser = argv.browser || Object.keys(browsers).slice(0,1);
                return runner
                    .startApp('npm run dev 2>&1 >log2.log', DELAY)
                    .src(['./tests/e2e-tests/index.test.js'])
                    .browsers(browser)
                    .run();
            })
            .then((exitCode) => {
                testcafe.close();
                fs.unlinkSync(config.storage.params.pathToFile);
                process.exit(exitCode)
            })
    });
