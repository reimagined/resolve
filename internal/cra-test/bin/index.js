/* eslint-disable spellcheck/spell-checker */
const path = require('path')
const fs = require('fs')
const os = require('os')
const { execSync } = require('child_process')
const rm = require('rimraf')
const log = require('consola')
const { getResolveExamples, getRepoRoot } = require('@internal/helpers')

const main = async () => {
  if (process.argv.length < 3) {
    throw Error(`minimum number of arguments expected: 3`)
  }

  const lang = process.argv[2]
  const testAll = lang === 'all'
  const testJs = testAll || lang === 'js'
  const testTs = testAll || lang === 'ts'

  if (!testAll && !testJs && !testTs) {
    throw Error(`unsupported language selector ${lang}`)
  }

  log.info(`language selector set to ${lang}`)
  log.info(`Preparing for create-resolve-app testing...`)
  const craParams = process.argv.slice(3).join(' ')
  log.info(`Passed params: ${craParams}`)

  const rootDir = getRepoRoot()
  const tempDir = path.resolve(os.tmpdir(), 'cra-tests')

  rm.sync(tempDir)
  fs.mkdirSync(tempDir)

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
    const exampleName = example.replace(/(?:-ts|-js)$/, '')
    execSync(
      `node ${path.resolve(
        rootDir,
        './packages/core/create-resolve-app/bin/index.js'
      )} ${craParams} -e ${exampleName} ${example}${testTs ? ' -t' : ''}`,
      { cwd: tempDir, stdio: 'inherit' }
    )
    log.info(`Testing create-resolve-app template: ${example}`)
    log.info(`Unit tests:`)
    execSync(`yarn test`, {
      cwd: path.resolve(tempDir, example),
      stdio: 'inherit',
    })
    log.info(`Unit tests done`)
    log.info(`E2e tests:`)
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
