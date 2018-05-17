import * as env from '../../configs/env.list.json'
import * as commands from '../../configs/command.list.json'
import * as cli from '../../configs/cli.list.json'
import * as paths from '../../configs/resolve.config.paths.json'
import * as deployOptions from '../../configs/deploy.options'

Object.keys(cli).forEach(key => (cli[key].default = undefined))

export { env, commands, cli, paths, deployOptions }
