/* eslint-disable spellcheck/spell-checker */
import fs from 'fs'
import fsEx from 'fs-extra'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import { program } from 'commander'
import log from 'consola'
import semver from 'semver'
import { includes, findKey, startsWith, isEmpty } from 'lodash'

const verbosityLevels: { [key: string]: number } = {
  silent: -1,
  normal: 3,
  debug: 4,
  trace: 5,
}

log.level = verbosityLevels.debug

enum TestBundle {
  api = 'api',
  testcafe = 'testcafe',
}

const resolveDir = (dir: string): string => path.resolve(process.cwd(), dir)

const getNpmTagVersion = (appDir: string, tag: string, registry: string) => {
  log.debug(`trying to figure out tag ${tag} version`)
  const pkg = findKey(
    JSON.parse(fs.readFileSync(path.resolve(appDir, 'package.json'), 'utf-8'))
      .dependencies,
    (version, name) => startsWith(name, 'resolve-')
  )

  log.debug(`resolve package for request ${pkg}`)

  const match = execSync(
    `npm dist-tag ls ${pkg} --registry=${registry} | grep ${tag}`
  ).toString()

  log.debug(`parsing results`)

  const tags = match
    .split(os.EOL)
    .map((row) => row.trim())
    .filter((row) => row !== '')
    .reduce((result, row) => {
      const [tag, version] = row.split(':').map((e) => e.trim())
      result[tag] = version
      return result
    }, {} as any)

  log.trace(tags)

  if (isEmpty(tags[tag])) {
    throw Error(`package ${pkg} not tagged with ${tag}`)
  }

  log.debug(`tag ${tag} determined version is ${tags[tag]}`)

  return tags[tag]
}

const prepareCloudBundle = async () => {
  const appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-app-'))
  log.info(`preparing cloud app bundle in ${appDir}`)

  await fsEx.emptyDir(appDir)
  await fsEx.copy(resolveDir('app'), appDir)
  await fsEx.remove(path.resolve(appDir, 'node_modules'))

  return appDir
}

type ActionOutputs = { [key: string]: string }

const extractActionOutput = (source: string): ActionOutputs =>
  source
    .split(os.EOL)
    .map((row) => row.trim())
    .filter((row) => row.startsWith('::set-output'))
    .map((row) => row.split(' ')[1].trim())
    .reduce((result, pair) => {
      const [name, value] = pair.split('::')
      result[name.replace('name=', '')] = value
      return result
    }, {} as any)

const deploy = async ({
  framework,
  stage,
}: {
  framework: string
  stage: string
}) => {
  log.info(`preparing cloud app bundle`)
  const appDir = await prepareCloudBundle()

  const env: { [key: string]: string } = {
    INPUT_LOCAL_MODE: 'true',
    INPUT_APP_DIRECTORY: appDir,
    INPUT_DEPLOY_ARGS: '--verbosity=trace',
    INPUT_GENERATE_APP_NAME: 'true',
  }

  if (stage === 'dev') {
    env['INPUT_RESOLVE_API_URL'] = 'https://api.resolve-dev.ml'
  } else if (stage === 'prod') {
    env['INPUT_RESOLVE_API_URL'] = 'https://api.resolve.sh'
  } else if (stage) {
    env['INPUT_RESOLVE_API_URL'] = stage
  }

  if (framework === 'dev') {
    env['INPUT_NPM_REGISTRY'] = 'npm.resolve-dev.ml:10080/'
    env['INPUT_RESOLVE_VERSION'] = getNpmTagVersion(
      appDir,
      'nightly',
      'http://npm.resolve-dev.ml:10080'
    )
  } else if (includes(framework, '-')) {
    env['INPUT_NPM_REGISTRY'] = 'npm.resolve-dev.ml:10080/'
    if (semver.valid(framework) !== null) {
      env['INPUT_RESOLVE_VERSION'] = framework
    } else {
      env['INPUT_RESOLVE_VERSION'] = getNpmTagVersion(
        appDir,
        'nightly',
        'http://npm.resolve-dev.ml:10080'
      )
    }
  } else if (framework && framework !== 'release') {
    if (semver.valid(framework) !== null) {
      env['INPUT_RESOLVE_VERSION'] = framework
    } else {
      env['INPUT_RESOLVE_VERSION'] = getNpmTagVersion(
        appDir,
        'nightly',
        'https://registry.npmjs.org'
      )
    }
  }

  log.info(`executing deploy action (long running)`)
  const deployAction = resolveDir('../.github/actions/deploy')

  try {
    const output = execSync(`node ${deployAction}/index.js`, {
      stdio: 'pipe',
      env: {
        ...process.env,
        ...env,
      },
    }).toString()

    log.debug(`deploy action output:`)
    log.debug(output)
    log.debug(`processing action output`)
    const outputs = extractActionOutput(output)
    log.debug(output)
    const outputFile = resolveDir('.deployment.json')
    log.debug(`writing outputs to ${outputFile}`)
    fs.writeFileSync(outputFile, JSON.stringify(outputs, null, 2))
    log.info(`done`)
  } catch (e) {
    log.error(e)
    process.exit(1)
  }
}

const runApiTests = async () => {
  log.debug(`running API tier tests`)
}

const runTestcafeTests = async () => {
  log.debug(`running WWW tier tests`)
}

const runTests = async (bundle: TestBundle) => {
  switch (bundle) {
    case TestBundle.api:
      return runApiTests()
    case TestBundle.testcafe:
      return runTestcafeTests()
    default:
      throw Error('Unknown test bundle')
  }
}

program.option('--verbosity <string>', 'verbosity level')

program
  .command('deploy')
  .option(
    '--framework <string>',
    'dev | release | specific (tag or semver)',
    'release'
  )
  .option('--stage <string>', 'dev | prod | <custom>')
  .action(deploy)

program
  .command('test <bundle>')
  .option('-u, --url <string>', 'application endpoint', 'http://localhost:3000')
  .action(runTests)

program.on('option:verbosity', () => {
  log.level = verbosityLevels[program.verbosity] || 3
})

program.parse(process.argv)
