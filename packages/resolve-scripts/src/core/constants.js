const env = require('../../configs/env.list.json')
const commands = require('../../configs/command.list.json')
const cli = require('../../configs/cli.list.json')
const paths = require('../../configs/resolve.config.paths.json')
const deployOptions = require('../../configs/deploy.options.json')
const resolveConfig = require('../../configs/resolve.config.json')
const statsConfig = require('../../configs/stats.config.json')
const schemaResolveConfig = require('../../configs/schema.resolve.config.json')

Object.keys(cli).forEach(key => (cli[key].default = undefined))

export {
  env,
  commands,
  cli,
  paths,
  deployOptions,
  resolveConfig,
  statsConfig,
  schemaResolveConfig
}
