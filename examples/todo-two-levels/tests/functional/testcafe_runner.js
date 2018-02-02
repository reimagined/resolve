#!/usr/bin/env node
import yargs from 'yargs'
import createTestCafe from 'testcafe'
import { getInstallations } from 'testcafe-browser-tools'
import fs from 'fs'
import path from 'path'
import config from '../../resolve.server.config.js'

const TIMEOUT = 20000
let testcafe = null

const argv = yargs
  .option('browser', {
    alias: 'b',
    default: false
  })
  .help().argv

getInstallations()
  .then(browsers =>
    createTestCafe('localhost', 1337, 1338)
      .then(tc => {
        testcafe = tc
        const runner = testcafe.createRunner()
        const browser = argv.browser || Object.keys(browsers).slice(0, 1)
        return runner
          .startApp('yarn dev', TIMEOUT)
          .src(['./tests/functional/index.test.js'])
          .browsers(browser)
          .run({
            selectorTimeout: TIMEOUT,
            assertionTimeout: TIMEOUT,
            pageLoadTimeout: TIMEOUT
          })
      })
      .then(exitCode => {
        testcafe.close()
        process.exit(exitCode)
      })
  )
  .catch(error => {
    console.log('Error: ' + error.stack) // eslint-disable-line no-console
    process.exit(1)
  })

process.on('exit', () => {
  try {
    const targetPath = path.resolve(
      __dirname,
      '../',
      config.storage.params.pathToFile
    )
    fs.unlinkSync(targetPath)
  } catch (err) {}
})
