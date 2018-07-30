#!/usr/bin/env node
require('source-map-support').install()

require('dotenv').config()

require('../dist/core/run_resolve_config_factory')
