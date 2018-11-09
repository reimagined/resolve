import chalk from 'chalk'
import { EOL } from 'os'

/* eslint-disable max-len */

const optionsInfo = [
  `Options:`,
  ``,
  `  -e, --example    creates an example application base on application from resolve examples directory`,
  `            Now you can choose one of the next examples:`,
  `              hello-world - used as a template for new reSolve applications`,
  `              shopping-list - shows how to work with read-models and view-models`,
  `              shopping-list-advanced - shows how to work with React-Native`,
  `              with-postcss - shows how to work with postCSS`,
  `              with-saga - shows how to use sagas`,
  `              with-styled-components - shows how to work with Styled Components`,
  `              hacker-news - HackerNews application clone with CQRS and EventSourcing`,
  `  -b, --branch     branch (optional, master is default)`,
  `  -c, --commit     commit`,
  `  -V, --version    outputs the version number`,
  `  -h, --help       outputs usage information`
].join(EOL)

const messages = {
  help: [
    `Usage: create-resolve-app ${chalk.green('<project-directory>')} [options]`,
    ``,
    optionsInfo,
    ``,
    `If you have any problems, you can create an issue:`,
    `  ${chalk.cyan('https://github.com/reimagined/resolve/issues/new')}`
  ].join(EOL),

  emptyAppNameError: [
    `Specify the project directory:`,
    `  ${chalk.cyan('create-resolve-app')} ${chalk.green(
      `<project-directory> [options]`
    )}`,
    ``,
    `For example:`,
    `  ${chalk.cyan('create-resolve-app')} ${chalk.green('my-resolve-app')}`,
    ``,
    optionsInfo,
    ``,
    `Run ${chalk.cyan('create-resolve-app --help')} to see all options.`
  ].join(EOL),

  startCreatingApp: ({ applicationName, exampleName, commit, branch }) =>
    [
      `Creating ${applicationName} in ./${applicationName} based on ${exampleName} example`,
      commit ? ` (commit SHA:${commit})` : ``,
      branch ? ` (from ${branch} branch)` : ``
    ].join(EOL),

  unknownOptions: options =>
    [
      `You have specified an unsupported option(s): ${chalk.red(options)}` +
        `` +
        `Run ${chalk.cyan('create-resolve-app --help')} to see all options.`
    ].join(EOL)
}

/* eslint-enable max-len */

export default messages
