#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const chalk = require('chalk');
const moduleCreator = require('../dist/create_resolve_app');

// eslint-disable-next-line no-console
const log = console.log;

const EOL = require('os').EOL;

const optionDefinitions = [
    { name: 'scripts', type: String },
    { name: 'sample', type: Boolean },
    { name: 'version', alias: 'V', type: Boolean },
    { name: 'help', alias: 'h', type: Boolean }
];

const messages = {
    help:
        `Usage: create-resolve-app ${chalk.green('<project-directory>')} [options]${EOL}` +
        EOL +
        `Options:${EOL}` +
        EOL +
        `  -V, --version    outputs the version number${EOL}` +
        `  -h, --help       outputs usage information${EOL}` +
        EOL +
        `If you have any problems, you can create an issue:${EOL}` +
        `  ${chalk.cyan('https://github.com/reimagined/resolve/issues/new')}`,

    emptyAppNameError:
        `Specify the project directory:${EOL}` +
        `  ${chalk.cyan('create-resolve-app')} ${chalk.green('<project-directory>')}${EOL}` +
        EOL +
        `For example:${EOL}` +
        `  ${chalk.cyan('create-resolve-app')} ${chalk.green('my-resolve-app')}${EOL}` +
        EOL +
        `Run ${chalk.cyan('create-resolve-app --help')} to see all options.`,

    unknownOptions: options =>
        `You have specified an unsupported option(s): ${chalk.red(options)}` +
        EOL +
        `Run ${chalk.cyan('create-resolve-app --help')} to see all options.`
};

const options = commandLineArgs(optionDefinitions, { partial: true });
const unknownOptions = options._unknown && options._unknown.filter(x => x.startsWith('-'));

const resolveVersion = require('../package.json').version;

if (unknownOptions && unknownOptions.length) {
    const options = unknownOptions.join();
    log(messages.unknownOptions(options));
} else if (options.help) {
    log(messages.help);
} else if (options.version) {
    log(resolveVersion);
} else if (!options._unknown) {
    log(messages.emptyAppNameError);
} else {
    let appName = options._unknown[0];
    moduleCreator(appName, options.scripts, !options.sample, resolveVersion);
}
