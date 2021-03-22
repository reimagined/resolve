/* eslint-disable spellcheck/spell-checker */
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const rm = require('rimraf')
const log = require('consola')
const { getResolveExamples } = require('@internal/helpers')

const main = async () => {
  log.info(`Preparing for create-resolve-app testing...`)
  const passedParams = process.argv.slice(2).join(' ')
  log.info(`Passed params: ${passedParams}`)

  const rootDir = path.resolve(__dirname, '../../../../')
  const tempDir = path.resolve(rootDir, 'cra-tests')

  rm.sync(tempDir)
  fs.mkdirSync(tempDir)

  const exampleNames = getResolveExamples().map((item) => item.name)
  exampleNames.forEach((example, index) => {
    log.info(
      `Create-resolve-app template testing ${index + 1} of ${
        exampleNames.length
      }: ${example}`
    )
    execSync(
      `node ${path.resolve(
        rootDir,
        './packages/core/create-resolve-app/bin/index.js'
      )} ${passedParams} -e ${example} ${example}`,
      { cwd: tempDir, stdio: 'inherit' }
    )
    log.info(`Testing create-resolve-app template: ${example}`)
    execSync(`yarn test:e2e`, {
      cwd: path.resolve(tempDir, example),
      stdio: 'inherit',
    })
    log.success(`Template testing done: ${example}`)
  })
}

main().catch((error) => {
  log.error(error)
  process.exit(1)
})
