import * as fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import webpack from 'webpack'
import { getLog } from './get-log'

import getWebpackConfigs from './get_webpack_configs'
import writePackageJsonsForAssemblies from './write_package_jsons_for_assemblies'
import getPeerDependencies from './get_peer_dependencies'
import showBuildInfo from './show_build_info'
import copyEnvToDist from './copy_env_to_dist'
import validateConfig from './validate_config'
import detectErrors from './detect_errors'
import { getDeprecatedTarget } from './get-deprecated-target'
import declareRuntimeEnv from './declare_runtime_env'

const log = getLog('build')

const warningAboutValue = (valueName) =>
  `The ${valueName} config parameter ignored. This parameter is not customizable for AWS serverless runtime.`

const messageAboutDefaultValue = (valueName) =>
  `Setting default ${valueName} for aws serverless runtime`

const buildMode = async (resolveConfig, adjustWebpackConfigs) => {
  log.debug('Starting "build" mode')

  if (resolveConfig.runtime?.module === '@resolve-js/runtime-aws-serverless') {
    if (resolveConfig.eventstoreAdapter != null) {
      log.warn(warningAboutValue('eventstoreAdapter'))
    }
    log.debug(messageAboutDefaultValue('eventstoreAdapter'))
    resolveConfig.eventstoreAdapter = {
      module: '@resolve-js/eventstore-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_EVENT_STORE_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_EVENT_STORE_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_EVENT_STORE_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER_ID'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
      },
    }

    if (resolveConfig.staticPath !== 'static') {
      log.warn(warningAboutValue('staticPath'))
    }
    messageAboutDefaultValue('staticPath')
    resolveConfig.staticPath = declareRuntimeEnv('RESOLVE_CLOUD_STATIC_URL')

    if (
      resolveConfig.readModelConnectors &&
      resolveConfig.readModelConnectors.default != null
    ) {
      log.warn(warningAboutValue('readModelConnectors.default'))
    }

    if (resolveConfig.readModelConnectors == null) {
      resolveConfig.readModelConnectors = {}
    }

    log.debug(messageAboutDefaultValue('readModelConnectors.default'))
    resolveConfig.readModelConnectors.default = {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER_ID'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
      },
    }
  }

  validateConfig(resolveConfig)

  const nodeModulesByAssembly = new Map()

  const webpackConfigs = await getWebpackConfigs({
    resolveConfig,
    nodeModulesByAssembly,
    adjustWebpackConfigs,
  })

  const peerDependencies = getPeerDependencies()

  const compiler = webpack(webpackConfigs)

  fsExtra.copySync(
    path.resolve(process.cwd(), resolveConfig.staticDir),
    path.resolve(process.cwd(), resolveConfig.distDir, './client')
  )

  await new Promise((resolve, reject) => {
    compiler.run((err, { stats }) => {
      console.log(' ') // eslint-disable-line no-console
      stats.forEach(showBuildInfo.bind(null, err))

      writePackageJsonsForAssemblies(
        resolveConfig.distDir,
        nodeModulesByAssembly,
        peerDependencies
      )

      copyEnvToDist(resolveConfig.distDir)

      const hasNoErrors = detectErrors(stats, false)

      if (hasNoErrors) {
        resolve()
        log.debug('Building complete')
      } else {
        reject(stats.toString(''))
      }
    })
  })

  const npmRc = path.resolve(process.cwd(), '.npmrc')
  if (fs.existsSync(npmRc)) {
    fs.copyFileSync(
      npmRc,
      path.resolve(
        process.cwd(),
        resolveConfig.distDir,
        `./common/${getDeprecatedTarget(resolveConfig)}-entry/.npmrc`
      )
    )
  }
}

export default buildMode
