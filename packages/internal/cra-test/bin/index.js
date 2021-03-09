/* eslint-disable spellcheck/spell-checker */
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const rm = require('rimraf')
const log = require('consola')

const main = async () => {
  log.info(`Preparing for create-resolve-app testing...`)
  const passedParams = process.argv.slice(2).join(' ')
  log.info(`Passed params: ${passedParams}`)

  const rootDir = path.resolve(__dirname, '../../../../')
  const examplesDir = path.resolve(rootDir, 'examples')
  if (!fs.existsSync(examplesDir)) {
    throw new Error('Examples directory not found')
  }

  const tempDir = path.resolve(rootDir, 'cra-tests')
  rm.sync(tempDir)
  fs.mkdirSync(tempDir)

  const exampleNames = fs
    .readdirSync(examplesDir, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name)

  exampleNames.forEach((example) => {
    log.info(`Using create-resolve-app template: ${example}`)
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
