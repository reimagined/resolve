#!/usr/bin/env node

const { execSync, spawn } = require('child_process')

const { patchPackageJson, getResolveDir } = require('@internal/helpers')

execSync('yarn', { cwd: getResolveDir(), stdio: 'inherit' })

const localRegistry = spawn('yarn', ['local-registry'], {
  cwd: getResolveDir()
})

localRegistry.stdout.on('data', data => {
  // eslint-disable-next-line
  console.log(String(data))
})

localRegistry.stderr.on('data', data => {
  // eslint-disable-next-line
  console.log(String(data))
})

localRegistry.on('close', code => {
  // eslint-disable-next-line
  console.log(`Local registry exited with code ${code}`)
})

execSync('yarn packages', { cwd: getResolveDir(), stdio: 'inherit' })

const rollback = patchPackageJson(process.cwd())

execSync('yarn', { cwd: process.cwd(), stdio: 'inherit' })

execSync(process.argv.slice(2).join(' '), { stdio: 'inherit' })

localRegistry.stdin.pause()
localRegistry.kill('SIGKILL')

rollback()

setTimeout(() => process.exit(0), 3000)
