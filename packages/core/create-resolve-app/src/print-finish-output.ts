/* eslint-disable no-console */

import chalk from 'chalk'
import isYarnAvailable from './is-yarn-available'

const printFinishOutput = async (applicationName: string) => {
  const displayCommand = (isDefaultCmd: boolean) =>
    isYarnAvailable() ? 'yarn' : isDefaultCmd ? 'npm' : 'npm run'

  console.log()
  console.log(`Success! ${applicationName} is created `)
  console.log('You can run the following commands in this directory:')

  console.log()
  console.log(chalk.cyan(`  ${displayCommand(false)} dev`))
  console.log('    Starts the development server.')

  console.log()
  console.log(chalk.cyan(`  ${displayCommand(true)} test`))
  console.log('    Starts the test runner.')

  console.log()
  console.log(chalk.cyan(`  ${displayCommand(false)} test:e2e`))
  console.log('    Starts the functionality test runner.')

  console.log()
  console.log(chalk.cyan(`  ${displayCommand(false)} build`))
  console.log('    Bundles the app into static files for production.')

  console.log()
  console.log(chalk.cyan(`  ${displayCommand(true)} start`))
  console.log(
    '    Starts the production server. (run ' +
      `${chalk.cyan(`${displayCommand(false)} build`)} before)`
  )

  console.log()
  console.log('We suggest that you begin by typing:')
  console.log()
  console.log(chalk.cyan('  cd'), `./${applicationName}`)
  console.log(`  ${chalk.cyan(`${displayCommand(false)} dev`)}`)
  console.log()
  console.log('Happy coding!')
}

export default printFinishOutput

/* eslint-enable no-console */
