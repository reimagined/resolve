#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const moduleCreator = require('../dist/create_resolve_app');

const optionDefinitions = [
    { name: 'scripts', type: String },
    { name: 'empty', type: Boolean }
];

const options = commandLineArgs(optionDefinitions);

let appName = process.argv[2];
if(!appName || !appName.indexOf('--scripts') || !appName.indexOf('--empty')) {
    appName = 'resolve-app';
}

moduleCreator(appName, options.scripts, options.empty);
