/* eslint-disable spellcheck/spell-checker */
const path = require('path')
const fs = require('fs')
const os = require('os')
const { execSync } = require('child_process')
const rm = require('rimraf')
const minimist = require('minimist')
const log = require('consola')
const { getResolveExamples, getRepoRoot } = require('@internal/helpers')

const main = async () => {
  log.info(`Preparing for create-resolve-app testing...`)
  const { _, lang, ...args } = minimist(process.argv.slice(2))

  const passedParams = [
    ..._,
    Object.entries(args).map(([key, value]) => `-${key} ${value}`),
  ].join(' ')
  log.info(`Passed params: ${passedParams}`)

  const rootDir = getRepoRoot()
  const tempDir = path.resolve(os.tmpdir(), 'cra-tests')

  rm.sync(tempDir)
  fs.mkdirSync(tempDir)

  const testAll = lang === 'all' || lang === undefined
  const testJs = testAll || lang === 'js'
  const testTs = testAll || lang === 'ts'

  const isTs = (exampleName) =>
    exampleName.includes('angular') ||
    exampleName.includes('typescript') ||
    exampleName.endsWith('-ts')

  const filterExamples = (exampleName) =>
    (testJs && !isTs(exampleName)) || (testTs && isTs(exampleName))

  const exampleNames = getResolveExamples()
    .map((item) => item.name)
    .filter(filterExamples)
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
