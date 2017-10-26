#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const moduleCreator = require('../dist/create_resolve_app');

const optionDefinitions = [
  { name: 'scripts', type: String },
  { name: 'sample', type: Boolean },
  { name: 'version', alias: 'v', type: String }
];

const options = commandLineArgs(optionDefinitions, { partial: true });
let appName = options._unknown[0] || 'resolve-app';

moduleCreator(appName, options.scripts, !options.sample, options.version);
