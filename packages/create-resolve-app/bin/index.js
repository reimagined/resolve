#!/usr/bin/env node

const commandLineArgs = require('command-line-args')
const chalk = require('chalk')
const { exec } = require('child_process');

// eslint-disable-next-line no-console
const log = console.log

const EOL = require('os').EOL

const optionDefinitions = [
  { name: 'example', alias: 'e', type: String },
  { name: 'branch', alias: 'b', type: String },
  { name: 'version', alias: 'V', type: Boolean },
  { name: 'help', alias: 'h', type: Boolean }
]

const optionsInfo =
  `Options:${EOL}` +
  EOL +
  `  -e, --example    creates an example application base on application from resolve examples directory${EOL}` +
  `                   Now you can choose one of the next examples:${EOL}` +
  `                     todo - todo list ${EOL}` +
  `                     hello-world - sinple empty example with single hello world page ${EOL}` +
  `                     todo-two-levels - two levels todo list ${EOL}` +
  `  -b, --branch     branch (master is default)${EOL}` +
  `  -V, --version    outputs the version number${EOL}` +
  `  -h, --help       outputs usage information${EOL}`

const messages = {
  help:
    `Usage: create-resolve-app ${chalk.green(
      '<project-directory>'
    )} [options]${EOL}` +
    EOL +
    optionsInfo +
    EOL +
    `If you have any problems, you can create an issue:${EOL}` +
    `  ${chalk.cyan('https://github.com/reimagined/resolve/issues/new')}`,

  emptyAppNameError:
    `Specify the project directory:${EOL}` +
    `  ${chalk.cyan('create-resolve-app')} ${chalk.green(
      '<project-directory> [options]'
    )}${EOL}` +
    EOL +
    `For example:${EOL}` +
    `  ${chalk.cyan('create-resolve-app')} ${chalk.green(
      'my-resolve-app'
    )}${EOL}` +
    EOL +
    optionsInfo +
    EOL +
    `Run ${chalk.cyan('create-resolve-app --help')} to see all options.`,

  unknownOptions: options =>
    `You have specified an unsupported option(s): ${chalk.red(options)}${EOL}` +
    EOL +
    `Run ${chalk.cyan('create-resolve-app --help')} to see all options.`
}

const options = commandLineArgs(optionDefinitions, { partial: true })
const unknownOptions =
  options._unknown && options._unknown.filter(x => x.startsWith('-'))

const resolveVersion = require('../package.json').version

if (unknownOptions && unknownOptions.length) {
  const options = unknownOptions.join()
  log(messages.unknownOptions(options))
} else if (options.help) {
  log(messages.help)
} else if (options.version) {
  log(resolveVersion)
} else if (!options._unknown) {
  log(messages.emptyAppNameError)
} else {
  let appName = options._unknown[0]
  let example = options.example;
  let resolveRepoPath = "https://github.com/reimagined/resolve.git";
  let examplePath = "./resolve/examples/" + example;

  console.log(`Creating ${appName} in ./${appName} based on ${example} example`);

  let branchChangeOption = (options.branch) ? `--branch ${options.branch}` : '';

  console.log(`mkdir ${appName} && cd ${appName} && git clone ${resolveRepoPath} ${branchChangeOption} && cp -r ${examplePath}/* ./ && cp -r ${examplePath}/.[^.]* ./ && rm -rf ./resolve && npm i >> log.log`);

  exec(`mkdir ${appName} && cd ${appName} && git clone ${resolveRepoPath} ${branchChangeOption} && cp -r ${examplePath}/* ./ && cp -r ${examplePath}/.[^.]* ./`, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }

    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}
