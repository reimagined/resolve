const optionsInfo = examples => [
  `Options:`,
  ``,
  `  -e, --example    creates an example application base on application from resolve examples directory`,
  `      Now you can choose one of the next examples:`,
  ...examples.map(
    ({ name, description }) => `          * ${name} - ${description}`
  ),
  `  -b, --branch     branch (optional, master is default)`,
  `  -c, --commit     commit`,
  `  -V, --version    outputs the version number`,
  `  -h, --help       outputs usage information`
]

const message = {
  help: ({ chalk, EOL, resolveExamples }) =>
    [
      `Usage: create-resolve-app ${chalk.green(
        '<project-directory>'
      )} [options]`,
      ``,
      ...optionsInfo(resolveExamples),
      ``,
      `If you have any problems, you can create an issue:`,
      `  ${chalk.cyan('https://github.com/reimagined/resolve/issues/new')}`
    ].join(EOL),

  emptyAppNameError: ({ chalk, EOL, resolveExamples }) =>
    [
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
      `Run ${chalk.cyan('create-resolve-app --help')} to see all options.`
    ].join(EOL),

  startCreatingApp: ({ EOL, applicationName, exampleName, commit, branch }) =>
    [
      `Creating ${applicationName} in ./${applicationName} based on ${exampleName} example`,
      commit ? ` (commit SHA:${commit})` : ``,
      branch ? ` (from ${branch} branch)` : ``
    ].join(EOL),

  unknownOptions: ({ EOL, chalk }, options) =>
    [
      `You have specified an unsupported option(s): ${chalk.red(
        options.join(' ')
      )}` +
        `` +
        `Run ${chalk.cyan('create-resolve-app --help')} to see all options.`
    ].join(EOL)
}

export default message
