#!/usr/bin/env node
const minimist = require('minimist')

const args = minimist(process.argv.slice(2))
const cwd = args._[0]

const { execSync } = require('child_process')

const { patchPackageJson } = require('@internal/helpers')

const rollback = patchPackageJson(cwd)

execSync('yarn', { cwd, stdio: 'inherit' })

execSync('npx resolve-cloud deploy', { cwd, stdio: 'inherit' })

rollback()

setTimeout(() => process.exit(0), 3000)
