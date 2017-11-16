#!/usr/bin/env node
require('regenerator-runtime/runtime');

const taskName = process.argv[2];
switch (taskName) {
    case 'dev':
        require('../dist/scripts/runDev');
        break;
    case 'build':
        require('../dist/scripts/runBuild');
        break;
    case 'start':
        require('../dist/scripts/runStart');
        break;
    case 'link':
        require('../dist/scripts/runLint');
        break;
    case 'test':
        require('../dist/scripts/runTest');
        break;
    case 'test:e2e':
        require('../dist/scripts/runTestE2e');
        break;
    case 'update':
        require('../dist/scripts/update');
        break;
    default:
        // eslint-disable-next-line no-console
        console.log('Unknown command');
        process.exit(1);
}
