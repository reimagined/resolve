#!/usr/bin/env node

const taskName = process.argv[2];
switch(taskName) {
    case 'dev':
        require('../scripts/runDev');
        break;
    case 'build':
        require('../scripts/runBuild');
        break;
    case 'start':
        require('../scripts/runStart');
        break;
    case 'link':
        require('../scripts/runLint');
        break;
    case 'test':
        require('../scripts/runTest');
        break;
    case 'test:e2e':
        require('../scripts/runTestE2e');
        break;
    default:
        console.log('Unknown command');
        process.exit(1);
}


