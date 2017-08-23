import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import spawn from 'cross-spawn';

// eslint-disable-next-line no-console
const log = console.log;
// eslint-disable-next-line no-console
const error = console.error;

const displayCommand = (useYarn, isDefaultCmd) =>
    useYarn ? 'yarn' : isDefaultCmd ? 'npm' : 'npm run';

const tryRenameReadme = (appPath) => {
    const readmeIsExist = fs.existsSync(path.join(appPath, 'README.md'));
    if (readmeIsExist) {
        fs.renameSync(path.join(appPath, 'README.md'), path.join(appPath, 'README.old.md'));
    }
    return readmeIsExist;
};

const tryCopyTemplate = (templatePath, appPath) => {
    const templateIsExist = fs.existsSync(templatePath);
    if (templateIsExist) {
        fs.copySync(templatePath, appPath);
    }
    return templateIsExist;
};

const tryRenameGitignore = (appPath) => {
    fs.move(path.join(appPath, 'gitignore'), path.join(appPath, '.gitignore'), [], (err) => {
        if (err) {
            if (err.code === 'EEXIST') {
                const data = fs.readFileSync(path.join(appPath, 'gitignore'));
                fs.appendFileSync(path.join(appPath, '.gitignore'), data);
                fs.unlinkSync(path.join(appPath, 'gitignore'));
            } else {
                throw err;
            }
        }
    });
};

const installDependencies = (useYarn) => {
    let command;
    let args;
    if (useYarn) {
        command = 'yarnpkg';
        args = ['install'];
    } else {
        command = 'npm';
        args = ['install', '--save'];
    }

    log(`Installing dependencies using ${command}...`);
    log();

    const proc = spawn.sync(command, args, { stdio: 'inherit' });
    if (proc.status !== 0) {
        error(`\`${command} ${args.join(' ')}\` failed`);
        return;
    }
};

const printOutput = (appName, appPath, useYarn, cdpath, readmeIsExist) => {
    log();
    log(`Success! Created ${appName} at ${appPath}`);
    log('Inside that directory, you can run several commands:');

    log();
    log(chalk.cyan(`  ${displayCommand(useYarn, true)} start`));
    log('    Starts the production server.');

    log();
    log(chalk.cyan(`  ${displayCommand(useYarn, false)} build`));
    log('    Bundles the app into static files for production.');

    log();
    log(chalk.cyan(`  ${displayCommand(useYarn, false)} dev`));
    log('    Starts the development server.');

    log();
    log(chalk.cyan(`  ${displayCommand(useYarn, false)} test`));
    log('    Starts the test runner.');

    log();
    log(chalk.cyan(`  ${displayCommand(useYarn, false)} test:e2e`));
    log('    Starts the functionality test runner.');

    log();
    log('We suggest that you begin by typing:');
    log();
    log(chalk.cyan('  cd'), cdpath);
    log(`  ${chalk.cyan(`${displayCommand(useYarn, false)} dev`)}`);
    if (readmeIsExist) {
        log();
        log(chalk.yellow('You had a `README.md` file, we renamed it to `README.old.md`'));
    }
    log();
    log('Happy coding!');
};

export default (appPath, appName, originalDirectory) => {
    const scriptsPackageName = require(path.join(__dirname, '../../', 'package.json')).name;
    const scriptsPath = path.join(appPath, 'node_modules', scriptsPackageName);
    const useYarn = fs.existsSync(path.join(appPath, 'yarn.lock'));

    const readmeIsExist = tryRenameReadme(appPath);

    const templatePath = path.join(scriptsPath, 'dist', 'template');
    if (!tryCopyTemplate(templatePath, appPath)) {
        error(`Could not locate supplied template: ${chalk.green(templatePath)}`);
        return;
    }

    installDependencies(useYarn);
    tryRenameGitignore(appPath);

    const cdpath = originalDirectory && path.join(originalDirectory, appName) === appPath
        ? appName
        : appPath;

    printOutput(appName, appPath, useYarn, cdpath, readmeIsExist);
};
