import env from '../../configs/env.list.json'
import commands from '../../configs/command.list.json'
import cli from '../../configs/cli.list.json'
import paths from '../../configs/resolve.config.paths.json'
import deployOptions from '../../configs/deploy.options'

Object.keys(cli).forEach(key => (cli[key].default = undefined))

export { env, commands, cli, paths, deployOptions }
