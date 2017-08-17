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

function shouldUseYarn() {
    try {
        execSync('yarnpkg --version', { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

function isSafeToCreateProjectIn(root, name) {
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

    const conflicts = fs
      .readdirSync(root)
      .filter(file => !validFiles.includes(file));
    if (conflicts.length < 1) {
        return true;
    }

    log(
      `The directory ${chalk.green(name)} contains files that could conflict:`
    );
    log();
    for (const file of conflicts) {
        log(`  ${file}`);
    }
    log();
    log(
      'Either try using a new directory name, or remove the files listed above.'
    );

    return false;
}

function printValidationResults(results) {
    if (typeof results !== 'undefined') {
        results.forEach((error) => {
            error(chalk.red(`  *  ${error}`));
        });
    }
}

function checkAppName(appName) {
    const validationResult = validateProjectName(appName);
    if (!validationResult.validForNewPackages) {
        error(
        `Could not create a project called ${chalk.red(
          `"${appName}"`
        )} because of npm naming restrictions:`
      );
        printValidationResults(validationResult.errors);
        printValidationResults(validationResult.warnings);
        process.exit(1);
    }
}

function checkIfOnline(useYarn) {
    if (!useYarn) {
      // Don't ping the Yarn registry.
      // We'll just assume the best case.
        return Promise.resolve(true);
    }

    return new Promise((resolve) => {
        dns.lookup('registry.yarnpkg.com', (err) => {
            if (err != null && process.env.https_proxy) {
          // If a proxy is defined, we likely can't resolve external hostnames.
          // Try to resolve the proxy name as an indication of a connection.
                dns.lookup(url.parse(process.env.https_proxy).hostname, (proxyErr) => {
                    resolve(proxyErr == null);
                });
            } else {
                resolve(err == null);
            }
        });
    });
}

function install(useYarn, dependencies, isOnline) {
    return new Promise((resolve, reject) => {
        let command;
        let args;
        if (useYarn) {
            command = 'yarnpkg';
            args = ['add', '--exact'];
            if (!isOnline) {
                args.push('--offline');
            }
            [].push.apply(args, dependencies);

            if (!isOnline) {
                log(chalk.yellow('You appear to be offline.'));
                log(chalk.yellow('Falling back to the local Yarn cache.'));
                log();
            }
        } else {
            command = 'npm';
            args = [
                'install',
                '--save',
                '--save-exact',
                '--loglevel',
                'error'
            ].concat(dependencies);
        }

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
}

function run(
    root,
    appName,
    originalDirectory,
    useYarn
  ) {
    const packageToInstall = 'resolve-scripts';
    const allDependencies = [packageToInstall];

    log('Installing packages. This might take a couple of minutes.');

    checkIfOnline(useYarn).then(isOnline => ({
        isOnline: isOnline,
        packageName: packageToInstall
    }))
    .then((info) => {
        const isOnline = info.isOnline;
        const packageName = info.packageName;
        log(`Installing ${chalk.cyan(packageToInstall)}...`);
        log();

        return install(useYarn, allDependencies, isOnline).then(
          () => packageName
        );
    })
    .then((packageName) => {
        const scriptsPath = path.resolve(
          process.cwd(),
          'node_modules',
          packageName,
          'dist',
          'scripts',
          'init.js'
        );
        const init = require(scriptsPath);

        init.default(root, appName, originalDirectory);
    })
}

export default function (name) {
    const root = path.resolve(name);
    const appName = path.basename(root);

    checkAppName(appName);
    fs.ensureDirSync(name);
    if (!isSafeToCreateProjectIn(root, name)) {
        process.exit(1);
    }
    log(`Creating a new Resolve app in ${chalk.green(root)}.`);
    log();

    const originalDirectory = process.cwd();
    process.chdir(root);

    const useYarn = shouldUseYarn();

    run(root, appName, originalDirectory, useYarn);
}
