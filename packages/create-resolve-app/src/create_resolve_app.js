import 'regenerator-runtime/runtime';
import spawn from 'cross-spawn';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import validateProjectName from 'validate-npm-package-name';
import { execSync } from 'child_process';
import dns from 'dns';
import url from 'url';

// eslint-disable-next-line no-console
const error = console.error;
// eslint-disable-next-line no-console
const log = console.log;

const yarnIsInstalled = () => {
    try {
        execSync('yarnpkg --version', { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
};

const validateAppDir = (appPath) => {
    const validFiles = [
        '.DS_Store',
        'Thumbs.db',
        '.git',
        '.gitignore',
        '.idea',
        'README.md',
        'LICENSE',
        'web.iml',
        '.hg',
        '.hgignore',
        '.hgcheck'
    ];
    log();

    return fs.readdirSync(appPath).filter(file => !validFiles.includes(file));
};

const displayValidationResults = (results) => {
    if (typeof results !== 'undefined') {
        results.forEach((error) => {
            error(chalk.red(`  *  ${error}`));
        });
    }
};

const checkAppName = (appName) => {
    const result = validateProjectName(appName);
    if (!result.validForNewPackages) {
        error(
            `Could not create a application called ${chalk.red(
                `"${appName}"`
            )} because of npm naming restrictions:`
        );
        displayValidationResults(result.errors);
        displayValidationResults(result.warnings);
    }
    return result.validForNewPackages;
};

const checkIfOnline = () => {
    return new Promise((resolve) => {
        dns.lookup('registry.yarnpkg.com', (err) => {
            if (err != null && process.env.https_proxy) {
                dns.lookup(url.parse(process.env.https_proxy).hostname, (proxyErr) => {
                    resolve(proxyErr == null);
                });
            } else {
                resolve(err == null);
            }
        });
    });
};

const installScripts = (useYarn, scriptsPackage, isOnline) => {
    return new Promise((resolve, reject) => {
        let command;
        let args;
        if (useYarn) {
            command = 'yarnpkg';
            args = ['add', '--exact'];
            if (!isOnline) {
                args.push('--offline');
            }

            if (!isOnline) {
                log(chalk.yellow('You appear to be offline.'));
                log(chalk.yellow('Falling back to the local Yarn cache.'));
                log();
            }
        } else {
            command = 'npm';
            args = ['install', '--save', '--save-exact', '--loglevel', 'error'];
        }
        args.push(scriptsPackage);

        const child = spawn(command, args, { stdio: 'inherit' });
        child.on('close', (code) => {
            if (code !== 0) {
                reject({
                    command: `${command} ${args.join(' ')}`
                });
                return;
            }
            resolve();
        });
    });
};

const runScripts = (appPath, appName, originalDirectory, scriptsPackage) => {
    const scriptsPath = path.resolve(
        appPath,
        'node_modules',
        scriptsPackage,
        'dist',
        'scripts',
        'init.js'
    );

    const init = require(scriptsPath);

    init.default(appPath, appName, originalDirectory);
};

export default async (name) => {
    const appPath = path.resolve(name);
    const appName = path.basename(appPath);

    const scriptsPackage = 'resolve-scripts';

    if (!checkAppName(appName)) {
        process.exit(1);
    }

    fs.ensureDirSync(appName);
    const conflicts = validateAppDir(appPath);
    if (conflicts.length > 0) {
        log(`The directory ${chalk.green(appName)} contains files that could conflict:`);
        log();
        for (const file of conflicts) {
            log(`  ${file}`);
        }
        log();
        log('Either try using a new directory name, or remove the files listed above.');
        process.exit(1);
    }

    log(`Creating a new Resolve app in ${chalk.green(appPath)}.`);
    log();

    const originalDirectory = process.cwd();
    process.chdir(appPath);

    log('Installing packages. This might take a couple of minutes.');

    const useYarn = yarnIsInstalled();
    const isOnline = !useYarn || (await checkIfOnline());

    log(`Installing ${chalk.cyan(scriptsPackage)}...`);
    log();

    await installScripts(useYarn, scriptsPackage, isOnline);

    runScripts(appPath, appName, originalDirectory, scriptsPackage);
};
