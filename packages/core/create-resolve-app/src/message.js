import { EOL } from 'os'
import chalk from 'chalk'

import { resolveExamples } from './constants'

const optionsInfo = (examples) => [
  `Options:`,
  ``,
  `  -e, --example    creates an example application based on an application from the reSolve examples directory`,
  `      You can choose one of the following examples:`,
  ...examples.map(
    ({ name, description }) => `          * ${name} - ${description}`
  ),
  `  -b, --branch     branch (optional, master is default)`,
  `  -c, --commit     commit`,
  `  -V, --version    outputs the version number`,
  `  -h, --help       outputs usage information`,
]

const formatLines = (lines) => lines.join(EOL)

const message = {
  help: () =>
    formatLines([
      `Usage: create-resolve-app ${chalk.green(
        '<project-directory>'
      )} [options]`,
      ``,
      ...optionsInfo(resolveExamples),
      ``,
      `If you have any problems, create an issue:`,
      `  ${chalk.cyan('https://github.com/reimagined/resolve/issues/new')}`,
    ]),

  emptyAppNameError: () =>
    formatLines([
      `Specify the project directory:`,
      `  ${chalk.cyan('create-resolve-app')} ${chalk.green(
        `<project-directory> [options]`
      )}`,
      ``,
      `For example:`,
      `  ${chalk.cyan('create-resolve-app')} ${chalk.green('my-resolve-app')}`,
      ``,
      ...optionsInfo(resolveExamples),
      ``,
      `Run ${chalk.cyan('create-resolve-app --help')} to view all options.`,
    ]),

  startCreatingApp: (applicationName, exampleName, commit, branch) =>
    formatLines([
      `Creating ${applicationName} in ./${applicationName} based on the ${exampleName} example`,
      commit ? ` (commit SHA:${commit})` : ``,
      branch ? ` (from ${branch} branch)` : ``,
    ]),

  unknownOptions: (unknownOptions) =>
    formatLines([
      `You have specified an unsupported option(s): ${chalk.red(
        unknownOptions.join(' ')
      )}`,
      `Run ${chalk.cyan('create-resolve-app --help')} to see all options.`,
    ]),

  missingExample: (exampleName, availableExamples) =>
    formatLines([
      `No such example, ${exampleName}. The following examples are available: `,
      ...availableExamples.map(
        ({ name, description, path }) =>
          `          * ${name} - ${description} - ${path}`
      ),
    ]),

  invalidApplicationName: (applicationName, errors, warnings) => {
    const message = `It is impossible to create an application called ${chalk.red(
      `"${applicationName}"`
    )} due to npm naming restrictions:`

    const details = [...(errors || []), ...(warnings || [])].map(
      (e) => `  *  ${e}`
    )
    return formatLines([message, ...details])
  },
}
export default message
