import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import spawn from 'cross-spawn';

// eslint-disable-next-line no-console
const log = console.log;
// eslint-disable-next-line no-console
const error = console.error;

const appDependencies = ['prop-types', 'uuid'];

const dependencies = [
    'react',
    'react-dom',
    'react-redux',
    'redux',
    'resolve-bus-memory',
    'resolve-redux',
    'resolve-storage-lite'
];

const devDependencies = ['chai', 'cross-env', 'testcafe', 'testcafe-browser-tools', 'yargs'];

const displayCommand = isDefaultCmd => (isDefaultCmd ? 'npm' : 'npm run');

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

const installDependencies = (dep, isDev) => {
    const command = 'npm';
    const args = ['install', isDev ? '--save-dev' : '--save'].concat(dep);

    const proc = spawn.sync(command, args, { stdio: 'inherit' });
    if (proc.status !== 0) {
        error(`\`${command} ${args.join(' ')}\` failed`);
        return;
    }
};

const printOutput = (appName, appPath, cdpath, readmeIsExist) => {
    log();
    log(`Success! Created ${appName} at ${appPath}`);
    log('Inside that directory, you can run several commands:');

    log();
    log(chalk.cyan(`  ${displayCommand(true)} start`));
    log('    Starts the production server.');

    log();
    log(chalk.cyan(`  ${displayCommand(false)} build`));
    log('    Bundles the app into static files for production.');

    log();
    log(chalk.cyan(`  ${displayCommand(false)} dev`));
    log('    Starts the development server.');

    log();
    log(chalk.cyan(`  ${displayCommand(false)} test`));
    log('    Starts the test runner.');

    log();
    log(chalk.cyan(`  ${displayCommand(false)} test:e2e`));
    log('    Starts the functionality test runner.');

    log();
    log('We suggest that you begin by typing:');
    log();
    log(chalk.cyan('  cd'), cdpath);
    log(`  ${chalk.cyan(`${displayCommand(false)} dev`)}`);
    if (readmeIsExist) {
        log();
        log(chalk.yellow('You had a `README.md` file, we renamed it to `README.old.md`'));
    }
    log();
    log('Happy coding!');
};

const deleteFolderRecursive = (path) => {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
            let curPath = path + '/' + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

export default (appPath, appName, originalDirectory, isEmpty, packagePath) => {
    const scriptsPackageName = require(path.join(__dirname, '../../', 'package.json')).name;
    const scriptsPath = path.join(appPath, 'node_modules', scriptsPackageName);

    const appPackage = require(path.join(appPath, 'package.json'));
    /* eslint-disable */
    appPackage.scripts = {
        build: 'resolve-scripts build',
        dev: 'resolve-scripts dev',
        start: 'resolve-scripts start',
        test: 'jest',
        'test:e2e':
            'cross-env NODE_ENV=tests babel-node ./tests/testcafe_runner.js --presets es2015,stage-0,react'
    };
    /* eslint-enable */
    fs.writeFileSync(path.join(appPath, 'package.json'), JSON.stringify(appPackage, null, 2));

    const readmeIsExist = tryRenameReadme(appPath);

    const templatePath = path.join(packagePath || scriptsPath, 'dist', 'template');

    if (!tryCopyTemplate(templatePath, appPath)) {
        error(`Could not locate supplied template: ${chalk.green(templatePath)}`);
        return;
    }

    if (isEmpty) {
        deleteFolderRecursive(path.join(appPath, 'client'));
        deleteFolderRecursive(path.join(appPath, 'common'));

        const templateEmptyPath = path.join(packagePath || scriptsPath, 'dist', 'template_empty');
        fs.copySync(templateEmptyPath, appPath);
    }

    fs.unlinkSync(path.join(appPath, '.eslintrc'));

    log('Installing app dependencies...');
    log();

    installDependencies(dependencies.concat(appDependencies), false);
    installDependencies(devDependencies, true);
    tryRenameGitignore(appPath);

    const cdpath = originalDirectory && path.join(originalDirectory, appName) === appPath
        ? appName
        : appPath;

    printOutput(appName, appPath, cdpath, readmeIsExist);
};
