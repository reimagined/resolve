import { EOL } from 'os'
import chalk from 'chalk'
import { ExampleData, formatExamplesList } from './format-examples-list'
import { resolveExamples } from './constants'

const optionsInfo = (examples: ExampleData[]) => [
  `Options:`,
  ``,
  `  -e, --example    creates an example application based on an application from the reSolve examples directory`,
  `      You can choose one of the following examples:`,
  ...formatExamplesList(examples, 4),
  `  -t, --typescript use TS version of application template`,
  `  -b, --branch     branch (optional, master is default)`,
  `  -c, --commit     commit`,
  `  -V, --version    outputs the version number`,
  `  -h, --help       outputs usage information`,
]

const formatLines = (lines: string[]) => lines.join(EOL)

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

  startCreatingApp: (
    applicationName: string,
    exampleName: string,
    commit: string,
    branch: string
  ) =>
    formatLines([
      `Creating ${applicationName} in ./${applicationName} based on the ${exampleName} example`,
      commit ? ` (commit SHA:${commit})` : ``,
      branch ? ` (from ${branch} branch)` : ``,
    ]),

  unknownOptions: (unknownOptions: string[]) =>
    formatLines([
      `You have specified an unsupported option(s): ${chalk.red(
        unknownOptions.join(' ')
      )}`,
      `Run ${chalk.cyan('create-resolve-app --help')} to see all options.`,
    ]),

  missingExample: (exampleName: string, availableExamples: ExampleData[]) =>
    formatLines([
      `No such example, ${exampleName}. The following examples are available: `,
      ...formatExamplesList(availableExamples, 4),
    ]),

  invalidApplicationName: (
    applicationName: string,
    errors?: string[],
    warnings?: string[]
  ) => {
    const message = `It is impossible to create an application called ${chalk.red(
      `"${applicationName}"`
    )} due to npm naming restrictions:`

    const details = [...(errors ?? []), ...(warnings ?? [])].map(
      (e) => `  *  ${e}`
    )
    return formatLines([message, ...details])
  },
}
export default message
