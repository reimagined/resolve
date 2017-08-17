#!/usr/bin/env node

const moduleCreator = require('../dist/create_resolve_app');

const appName = process.argv[2] || 'resolve-app';
moduleCreator(appName);
