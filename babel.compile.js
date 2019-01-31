const fs = require('fs')
const path = require('path')
const http = require('http')
const { execSync } = require('child_process')
const find = require('glob').sync
const babel = require('@babel/cli/lib/babel/dir').default

const localRegistry = {
  protocol: 'http',
  host: '0.0.0.0',
  port: 10080,
  directory: path.join(__dirname, '.packages')
}

function safeName(name) {
  return `${name.replace(/@/, '').replace(/[/|\\]/g, '-')}.tgz`
}

let _configs
function getCompileConfigs() {
  if (_configs) {
    return _configs
  }

  const configs = []

  for (const filePath of find('./packages/**/package.json', {
    cwd: __dirname
  })) {
    if (filePath.includes('node_modules')) {
      continue
    }

    const { version, name, babelCompile } = require(filePath)

    if (!Array.isArray(babelCompile)) {
      throw new Error(`[${name}] package.json "babelCompile" must be an array`)
    }

    for (let index = 0; index < babelCompile.length; index++) {
      const config = babelCompile[index]
      if (config.moduleType.constructor !== String) {
        throw new Error(`.babelCompile[${index}].moduleType must be a string`)
      }
      if (config.moduleTarget.constructor !== String) {
        throw new Error(`.babelCompile[${index}].moduleTarget must be a string`)
      }
      if (config.inputDir.constructor !== String) {
        throw new Error(`.babelCompile[${index}].inputDir must be a string`)
      }
      if (config.outDir.constructor !== String) {
        throw new Error(`.babelCompile[${index}].outDir must be a string`)
      }

      config.name = name
      config.version = version
      config.directory = path.join(__dirname, path.dirname(filePath))
      config.inputDir = path.join(config.directory, config.inputDir)
      config.outDir = path.join(config.directory, config.outDir)
      configs.push(config)
    }
  }

  _configs = configs

  return configs
}

let _resolvePackages
function getResolvePackages() {
  if (_resolvePackages) {
    return _resolvePackages
  }

  const resolvePackages = []

  for (const filePath of find('./packages/**/package.json', {
    cwd: __dirname
  })) {
    if (filePath.includes('node_modules')) {
      continue
    }

    const { name } = require(filePath)

    resolvePackages.push(name)
  }

  resolvePackages.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))

  _resolvePackages = resolvePackages

  return resolvePackages
}

let _resolveExamples
function getResolveExamples() {
  if (_resolveExamples) {
    return _resolveExamples
  }

  const resolveExamples = []

  for (const filePath of find('./examples/*/package.json', {
    cwd: __dirname
  })) {
    if (filePath.includes('node_modules')) {
      continue
    }

    const { name, description } = require(filePath)

    if (!description) {
      throw new Error(`Example "${name}" .description must be a string`)
    }

    resolveExamples.push({ name, description })
  }

  resolveExamples.sort((a, b) =>
    a.name > b.name ? 1 : a.name < b.name ? -1 : 0
  )

  _resolveExamples = resolveExamples

  return resolveExamples
}

function getConfig({ moduleType, moduleTarget }) {
  const resolvePackages = getResolvePackages()
  const resolveExamples = getResolveExamples()

  process.env.__RESOLVE_PACKAGES__ = JSON.stringify(resolvePackages)
  process.env.__RESOLVE_EXAMPLES__ = JSON.stringify(resolveExamples)
  process.env.__RESOLVE_VERSION__ = require('./package').version

  let useESModules,
    regenerator,
    helpers,
    modules,
    targets,
    loose,
    forceAllTransforms = false

  switch (moduleType) {
    case 'cjs': {
      modules = 'commonjs'
      useESModules = false
      break
    }
    case 'es': {
      modules = 'false'
      useESModules = true
      break
    }
    default: {
      throw new Error('process.env.MODULE_TYPE must be one of ["cjs", "es"]')
    }
  }

  switch (moduleTarget) {
    case 'server': {
      loose = false
      regenerator = false
      helpers = false
      targets = {
        node: '8.10'
      }
      break
    }
    case 'client': {
      loose = true
      regenerator = true
      helpers = true
      forceAllTransforms = true
      break
    }
    default: {
      throw new Error(
        'process.env.MODULE_TARGET must be one of ["server", "client"]'
      )
    }
  }

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          loose,
          targets,
          forceAllTransforms,
          modules
        }
      ],
      '@babel/preset-react'
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-do-expressions',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-function-bind',
      '@babel/plugin-proposal-function-sent',
      '@babel/plugin-proposal-json-strings',
      '@babel/plugin-proposal-logical-assignment-operators',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-numeric-separator',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-object-rest-spread',
      ['@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' }],
      '@babel/plugin-proposal-throw-expressions',
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-syntax-import-meta',
      [
        '@babel/plugin-transform-runtime',
        {
          corejs: false,
          helpers,
          regenerator,
          useESModules
        }
      ],
      [
        'transform-inline-environment-variables',
        {
          include: [
            '__RESOLVE_PACKAGES__',
            '__RESOLVE_EXAMPLES__',
            '__RESOLVE_VERSION__'
          ]
        }
      ]
    ]
  }
}

async function compile() {
  const configs = getCompileConfigs()

  const promises = []
  for (const config of configs) {
    promises.push(
      babel({
        babelOptions: {
          ...getConfig({
            moduleType: config.moduleType,
            moduleTarget: config.moduleTarget
          }),
          sourceMaps: true,
          babelrc: false
        },
        cliOptions: {
          filenames: [config.inputDir],
          outDir: config.outDir,
          deleteDirOnStart: true
        }
      })
        .then(() => {
          // eslint-disable-next-line no-console
          console.log(
            `↑ [${config.name}] { moduleType: "${
              config.moduleType
            }", moduleType: "${config.moduleTarget}" }`
          )
        })
        .catch(error => {
          // eslint-disable-next-line no-console
          console.error(error)
          process.exit(1)
        })
    )
  }
  await Promise.all(promises)
}

function pack({ resolvePackages, directory, name }) {
  fs.copyFileSync(
    path.join(directory, 'package.json'),
    path.join(directory, 'package.backup.json')
  )
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(directory, 'package.json'))
  )
  for (const namespace of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
  ]) {
    if (!packageJson[namespace]) {
      continue
    }
    for (const name of resolvePackages) {
      if (packageJson[namespace][name]) {
        packageJson[namespace][name] =
          namespace === 'peerDependencies'
            ? '*'
            : `${localRegistry.protocol}://${localRegistry.host}:${
                localRegistry.port
              }/${safeName(name)}`
      }
    }
  }

  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )
  if (!fs.existsSync(localRegistry.directory)) {
    fs.mkdirSync(localRegistry.directory)
  }
  execSync(
    `yarn pack --filename="${path.join(
      localRegistry.directory,
      safeName(name)
    )}"`,
    { cwd: directory }
  )
  fs.unlinkSync(path.join(directory, 'package.json'))
  fs.renameSync(
    path.join(directory, 'package.backup.json'),
    path.join(directory, 'package.json')
  )
}

switch (process.argv[2]) {
  case '--run': {
    compile().catch(error => {
      // eslint-disable-next-line no-console
      console.error(error)
      process.exit(1)
    })
    break
  }
  case '--packages': {
    const configs = getCompileConfigs()
    const resolvePackages = getResolvePackages()
    for (const { directory, name, version } of configs) {
      pack({
        resolvePackages,
        directory,
        name,
        version
      })
    }
    break
  }
  case '--local-registry': {
    startLocalRegistry().catch(error => {
      // eslint-disable-next-line no-console
      console.error(error)
      process.exit(1)
    })
    break
  }
  default:
}

async function startLocalRegistry() {
  http
    .createServer((req, res) => {
      const fileName = req.url.slice(1)

      const filePath = path.join(localRegistry.directory, fileName)

      const resolvePackages = getResolvePackages()

      if (
        !resolvePackages.includes(fileName.replace('.tgz', '')) ||
        !fs.existsSync(filePath)
      ) {
        res.writeHead(404, {
          'Content-Type': 'text/plain',
          'Content-Length': 0
        })
        res.end()
        return
      }

      const stat = fs.statSync(filePath)

      res.writeHead(200, {
        'Content-Type': 'application/tar+gzip',
        'Content-Length': stat.size
      })

      const readStream = fs.createReadStream(filePath)
      readStream.pipe(res)
    })
    .listen(localRegistry.port, localRegistry.host, error => {
      if (error) {
        // eslint-disable-next-line no-console
        console.error(error)
        return
      }
      // eslint-disable-next-line no-console
      console.log(
        `Local registry listening on http://${localRegistry.host}:${
          localRegistry.port
        }`
      )
    })
}

module.exports.getConfig = getConfig
module.exports.compile = compile
module.exports.localRegistry = localRegistry
