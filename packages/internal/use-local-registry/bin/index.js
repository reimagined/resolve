#!/usr/bin/env node

const { execSync } = require('child_process')

const { patchPackageJson } = require('@internal/helpers')

const rollback = patchPackageJson(process.cwd())

execSync('yarn', { cwd: process.cwd(), stdio: 'inherit' })

execSync(process.argv.slice(2).join(' '), { stdio: 'inherit' })

rollback()

setTimeout(() => process.exit(0), 3000)
