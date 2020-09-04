#!/usr/bin/env node

const { execSync } = require('child_process')

const { getResolveDir } = require('@internal/helpers')

execSync('yarn cache clean', { cwd: getResolveDir(), stdio: 'inherit' })
execSync('yarn', { cwd: getResolveDir(), stdio: 'inherit' })
