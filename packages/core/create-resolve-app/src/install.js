const install = ({ path, chalk, execSync, applicationName, useYarn }) => {
  // eslint-disable-next-line
  console.log()
  // eslint-disable-next-line
  console.log(chalk.green('Install dependencies'))
  
  const packageJsonPath = path.join(process.cwd(), applicationName, 'package.json')
  const packageJson = require(packageJsonPath)
  
  if (packageJson.workspaces && !useYarn) {
    // eslint-disable-next-line
    throw 'Managing dependencies in a monorepo is not supported with `npm`. Please use `yarn` to install dependencies.'
  }
  
  const command = `cd ./${applicationName} && ${useYarn ? 'yarn' : 'npm i'}`
  const proc = execSync(command, [], { stdio: 'inherit', shell: true })
  if (proc.status !== 0) {
    throw Error(`\`${command}\` failed`)
  }
}

export default install
