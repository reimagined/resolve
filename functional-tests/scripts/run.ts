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
import { getInstallations } from 'testcafe-browser-tools'

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

const sanitizedEnvironment = () => {
  const env = {
    ...process.env,
  }
  delete env.npm_config_registry
  delete env.NPM_CONFIG_REGISTRY
  delete env.RESOLVE_API_URL

  return env
}

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

const publishToPrivateRegistry = async (token: string) => {
  if (!token) {
    throw Error('npm registry token must be specified')
  }

  const env: { [key: string]: string } = {
    INPUT_TAG: 'local-dev',
    INPUT_RELEASE_TYPE: 'local-dev',
    INPUT_NPM_REGISTRY: 'npm.resolve-dev.ml:10080',
    INPUT_NPM_TOKEN: token,
  }

  log.info(`executing publish action (long running)`)
  const publishAction = resolveDir('../.github/actions/publish')

  const output = execSync(`node ${publishAction}/index.js`, {
    stdio: 'pipe',
    cwd: resolveDir('../'),
    env: {
      ...sanitizedEnvironment(),
      ...env,
    },
  }).toString()

  log.debug(`publish action output:`)
  log.debug(output)
  log.debug(`processing action output`)
  const outputs = extractActionOutput(output)
  const outputFile = resolveDir('.publishing.json')
  log.debug(`writing outputs to ${outputFile}`)
  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      {
        ...env,
        ...outputs,
        npmToken: token,
      },
      null,
      2
    )
  )
  return outputs
}

const deploy = async ({
  framework,
  stage,
  publish,
  npmToken,
}: {
  framework: string
  stage: string
  publish: boolean
  npmToken: string
}) => {
  let publishedVersion: string | null = null
  if (publish) {
    log.info(`publishing current repo to registry`)
    const outputs = await publishToPrivateRegistry(npmToken)
    publishedVersion = outputs['release_version']
    log.info(`published version ${publishedVersion}`)
  }

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

  if (publishedVersion) {
    env['INPUT_NPM_REGISTRY'] = 'npm.resolve-dev.ml:10080/'
    env['INPUT_RESOLVE_VERSION'] = publishedVersion
  } else if (framework === 'dev') {
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
        framework,
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
        ...sanitizedEnvironment(),
        ...env,
      },
    }).toString()

    log.debug(`deploy action output:`)
    log.debug(output)
    log.debug(`processing action output`)
    const outputs = extractActionOutput(output)
    const outputFile = resolveDir('.deployment.json')
    log.debug(`writing outputs to ${outputFile}`)
    fs.writeFileSync(
      outputFile,
      JSON.stringify(
        {
          ...env,
          ...outputs,
        },
        null,
        2
      )
    )
    log.info(`done`)
  } catch (e) {
    log.error(e)
    process.exit(1)
  }
}

const clean = async ({ deployment }: { deployment: string }) => {
  try {
    const deploymentFile = resolveDir(deployment)

    log.debug(`reading ${deploymentFile}`)
    const {
      deployment_id: deploymentId,
      INPUT_RESOLVE_API_URL: resolveApiUrl,
    } = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'))

    const env: { [key: string]: string } = {}
    if (resolveApiUrl) {
      env['RESOLVE_API_URL'] = resolveApiUrl
    }

    log.debug(`removing deployment ${deploymentId}`)
    execSync(`yarn --silent resolve-cloud remove ${deploymentId} --no-wait`, {
      stdio: 'inherit',
      env: {
        ...sanitizedEnvironment(),
        ...env,
      },
    })

    fsEx.removeSync(deploymentFile)
  } catch (e) {
    log.error(e)
    process.exit(1)
  }
}

type TestBundleOptions = {
  url?: string
  deployment?: string
  testcafeBrowser?: string
  testcafeArgs?: string
  testcafeTimeout?: number
  ciMode: boolean
}

const getTargetUrl = (options: TestBundleOptions): string => {
  const { deployment, url } = options

  if (deployment) {
    const { app_url: appUrl } = JSON.parse(
      fs.readFileSync(resolveDir(deployment), 'utf-8')
    )
    return appUrl
  }
  if (url) {
    return url
  }

  log.debug(
    `neither url or deployment option found, trying to read default .deployment.json`
  )

  try {
    const { app_url: appUrl } = JSON.parse(
      fs.readFileSync(resolveDir('.deployment.json'), 'utf-8')
    )
    return appUrl
  } catch {
    log.debug(`failed, giving up`)
  }

  log.warn(`cannot determine target URL, fallback to localhost`)
  return 'http://0.0.0.0:3000'
}

const runApiTests = async (options: TestBundleOptions) => {
  log.debug(`running API tier tests`)

  const url = getTargetUrl(options)

  log.debug(`target url ${url}`)
  log.debug(`executing Jest runner`)
  try {
    execSync(`yarn jest --config=${resolveDir('jest.config-api.js')}`, {
      stdio: 'inherit',
      env: {
        ...sanitizedEnvironment(),
        RESOLVE_API_TESTS_TARGET_URL: url,
      },
    })
  } catch (e) {
    log.error(e)
    process.exit(1)
  }
}

const runTestcafeTests = async (options: TestBundleOptions) => {
  try {
    log.debug(`running WWW tier tests`)

    const url = getTargetUrl(options)

    log.debug(`target url ${url}`)
    log.debug(`executing testcafe runner`)

    const browser =
      options.testcafeBrowser ?? Object.keys(await getInstallations())[0]
    log.debug(`browser set to: ${browser}`)

    const timeout = options.testcafeTimeout ?? 2000
    log.debug(`timeout set to: ${timeout}`)

    const args = options.testcafeArgs ?? []
    log.debug(`args set to: ${args}`)

    const xvfbCmd = options.ciMode
      ? `xvfb-run --server-args="-screen 0 1280x720x24" `
      : ''

    log.debug(`executing Testcafe runner`)
    execSync(
      [
        `${xvfbCmd}node node_modules/testcafe/bin/testcafe ${browser}`,
        `${resolveDir('testcafe')}`,
        `--app-init-delay ${timeout}`,
        `--selector-timeout ${timeout}`,
        `--assertion-timeout ${timeout}`,
        `--page-load-timeout ${timeout}`,
        args,
      ].join(' '),
      {
        stdio: 'inherit',
        env: {
          ...sanitizedEnvironment(),
          RESOLVE_TESTCAFE_TESTS_TARGET_URL: url,
        },
      }
    )
  } catch (e) {
    log.error(e)
    process.exit(1)
  }
}

const runTests = async (bundle: TestBundle, options: TestBundleOptions) => {
  switch (bundle) {
    case TestBundle.api:
      return runApiTests(options)
    case TestBundle.testcafe:
      return runTestcafeTests(options)
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
  .option('--publish', 'publish current repo to private registry', false)
  .option('--npm-token <string>', 'NPM token to publish with')
  .action(deploy)

program
  .command('clean')
  .option(
    '-d, --deployment <string>',
    'deployment JSON file generated by "deploy" command',
    '.deployment.json'
  )
  .action(clean)

program
  .command('test <bundle>')
  .option('--ci-mode', 'run within CI system')
  .option('-u, --url <string>', 'application endpoint')
  .option(
    '-d, --deployment <string>',
    'deployment JSON file generated by "deploy" command'
  )
  .option('--testcafe-browser <string>', 'testcafe browser name')
  .option('--testcafe-timeout <number>', 'testcafe timeout')
  .option('--testcafe-args <string>', 'testcafe args')
  .action(runTests)

program.on('option:verbosity', () => {
  log.level = verbosityLevels[program.verbosity] || 3
})

program.parse(process.argv)
