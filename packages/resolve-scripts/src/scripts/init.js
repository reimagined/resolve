import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

// eslint-disable-next-line no-console
const log = console.log;
// eslint-disable-next-line no-console
const error = console.error;

export default (appPath, appName, originalDirectory) => {
    const ownPackageName = require(path.join(__dirname, '..', 'package.json')).name;
    const ownPath = path.join(appPath, 'node_modules', ownPackageName);
    const useYarn = fs.existsSync(path.join(appPath, 'yarn.lock'));

    const readmeExists = fs.existsSync(path.join(appPath, 'README.md'));
    if (readmeExists) {
        fs.renameSync(path.join(appPath, 'README.md'), path.join(appPath, 'README.old.md'));
    }

    // Copy the files for the user
    const templatePath = path.join(ownPath, 'dist', 'template');
    if (fs.existsSync(templatePath)) {
        fs.copySync(templatePath, appPath);
    } else {
        error(`Could not locate supplied template: ${chalk.green(templatePath)}`);
        return;
    }

    // Rename gitignore after the fact to prevent npm from renaming it to .npmignore
    // See: https://github.com/npm/npm/issues/1862
    fs.move(path.join(appPath, 'gitignore'), path.join(appPath, '.gitignore'), [], (err) => {
        if (err) {
            // Append if there's already a `.gitignore` file there
            if (err.code === 'EEXIST') {
                const data = fs.readFileSync(path.join(appPath, 'gitignore'));
                fs.appendFileSync(path.join(appPath, '.gitignore'), data);
                fs.unlinkSync(path.join(appPath, 'gitignore'));
            } else {
                throw err;
            }
        }
    });

    // Display the most elegant way to cd.
    // This needs to handle an undefined originalDirectory for
    // backward compatibility with old global-cli's.
    let cdpath;
    if (originalDirectory && path.join(originalDirectory, appName) === appPath) {
        cdpath = appName;
    } else {
        cdpath = appPath;
    }

    // Change displayed command to yarn instead of yarnpkg
    const displayedCommand = useYarn ? 'yarn' : 'npm';

    log();
    log(`Success! Created ${appName} at ${appPath}`);
    log('Inside that directory, you can run several commands:');

    log();
    log(chalk.cyan(`  ${displayedCommand} start`));
    log('    Starts the production server.');

    log();
    log(chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}build`));
    log('    Bundles the app into static files for production.');

    log();
    log(chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}dev`));
    log('    Starts the development server.');

    log();
    log(chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}test`));
    log('    Starts the test runner.');

    log();
    log(chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}test:e2e`));
    log('    Starts the functionality test runner.');

    log();
    log('We suggest that you begin by typing:');
    log();
    log(chalk.cyan('  cd'), cdpath);
    log(`  ${chalk.cyan(`${displayedCommand} dev`)}`);
    if (readmeExists) {
        log();
        log(chalk.yellow('You had a `README.md` file, we renamed it to `README.old.md`'));
    }
    log();
    log('Happy hacking!');
};
