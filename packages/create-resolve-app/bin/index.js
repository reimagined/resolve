#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const fs = require('fs');
const path = require('path');
const moduleCreator = require('../dist/create_resolve_app');

const optionDefinitions = [
  { name: 'scripts', type: String },
  { name: 'sample', type: Boolean }
];

const options = commandLineArgs(optionDefinitions, { partial: true });
let appName = options._unknown[0] || 'resolve-app';

const resolveVersion = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../package.json')
  )
).version;

moduleCreator(appName, options.scripts, !options.sample, resolveVersion);
