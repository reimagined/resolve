import { execSync } from 'child_process'
import chalk from 'chalk'
import getLog from '@resolve-js/debug-levels'
import isYarnAvailable from './is-yarn-available'

const log = getLog('resolve:create-resolve-app:install')

const install = async (applicationPath) => {
  // eslint-disable-next-line no-console
  console.log(chalk.green('Install dependencies'))

  const useYarn = isYarnAvailable()
  const command = `${useYarn ? 'yarn --mutex file' : 'npm install'}`

  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: applicationPath,
    })
    log.debug('Install succeeded')
  } catch (err) {
    for (let retry = 0; retry < 10; retry++) {
      try {
        execSync(command, {
          cwd: applicationPath,
        })
        return
      } catch (error) {
        if (
          error != null &&
          error.stderr != null &&
          error.stderr.toString().includes('http://0.0.0.0:10080') &&
          error.stderr.toString().includes('ENOENT: no such file or directory')
        ) {
          log.debug(`Install retried ${retry + 1}/10`)
          continue
        }
        break
      }
    }
    log.debug('Install failed')
    process.exit(1)
  }
}

export default install
