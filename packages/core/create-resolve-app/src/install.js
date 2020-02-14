const install = pool => async () => {
  const { chalk, console, execSync, applicationPath, useYarn } = pool
  console.log()
  console.log(chalk.green('Install dependencies'))

  const command = `${useYarn ? 'yarn' : 'npm install'}`

  execSync(command, { stdio: 'inherit', cwd: applicationPath })
}

export default install
