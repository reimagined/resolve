#!/usr/bin/env node
const createTestCafe = require('testcafe');
const { getInstallations } = require('testcafe-browser-tools');
let testcafe = null;
getInstallations()
    .then((browsers) => {
        createTestCafe('localhost', 1337, 1338)
            .then((tc) => {
                testcafe = tc;
                const runner = testcafe.createRunner();
                const browser = Object.keys(browsers).slice(0, 1);
                return runner
                    .startApp('npm start')
                    .src(['./testcafe/index.tests.js'])
                    .browsers(browser)
                    .run();
            })
            .then(() => {
                testcafe.close();
            })
    });
