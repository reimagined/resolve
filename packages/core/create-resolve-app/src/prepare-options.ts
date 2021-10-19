import chalk from 'chalk'
import boxen from 'boxen'
import https from 'https'
import commandLineArgs from 'command-line-args'

import message from './message'

import { resolveVersion } from './constants'

const prepareOptions = async () => {
  const cliArgs = commandLineArgs(
    [
      { name: 'example', alias: 'e', type: String },
      { name: 'branch', alias: 'b', type: String },
      { name: 'commit', alias: 'c', type: String },
      { name: 'version', alias: 'V', type: Boolean },
      { name: 'help', alias: 'h', type: Boolean },
      { name: 'typescript', alias: 't', type: Boolean },
      { name: 'local-registry', type: Boolean },
    ],
    { partial: true }
  )

  const unknownCliArgs =
    cliArgs._unknown && cliArgs._unknown.filter((x) => x.startsWith('-'))

  if (unknownCliArgs && unknownCliArgs.length > 0) {
    // eslint-disable-next-line no-console
    console.error(message.unknownOptions(unknownCliArgs))
    return process.exit(1)
  } else if (cliArgs.help) {
    // eslint-disable-next-line no-console
    console.log(message.help())
    return process.exit(0)
  } else if (cliArgs.version) {
    // eslint-disable-next-line no-console
    console.log(resolveVersion)
    return process.exit(0)
  } else if (!cliArgs._unknown) {
    // eslint-disable-next-line no-console
    console.error(message.emptyAppNameError())
    return process.exit(1)
  } else {
    const applicationName = cliArgs._unknown[0]
    const {
      commit,
      branch,
      example: exampleName = 'react',
      typescript: useTypescript = false,
    } = cliArgs

    const localRegistry = cliArgs['local-registry']

    const masterBranchVersionJsonUrl =
      'https://raw.githubusercontent.com/reimagined/resolve/master/packages/core/create-resolve-app/package.json'
    const masterBranchVersion = await new Promise((resolve) => {
      let responseString = ''
      https.get(masterBranchVersionJsonUrl, (response) => {
        response.on('data', (data) => (responseString += data.toString()))
        response.on('end', () =>
          Promise.resolve()
            .then(() => JSON.parse(responseString).version)
            .catch(() => null)
            .then(resolve)
        )
        response.on('error', () => resolve(null))
      })
    })

    if (
      masterBranchVersion != null &&
      masterBranchVersion !== resolveVersion &&
      branch == null &&
      commit == null
    ) {
      const text = chalk.red(`You are using create-resolve-app version ${resolveVersion}, but actual one is ${masterBranchVersion}
        Most likely you have package globally installed in npm or yarn, which is highly discouraged
        Run "npm uninstall -g create-resolve-app" or "yarn global remove create-resolve-app" in console`)

      // eslint-disable-next-line no-console
      console.warn(
        boxen(text, {
          borderColor: 'red',
          align: 'center',
          float: 'center',
          margin: 1,
          padding: 1,
        })
      )
    }

    return {
      applicationName,
      commit,
      branch,
      exampleName,
      localRegistry,
      useTypescript,
    }
  }
}

export default prepareOptions
