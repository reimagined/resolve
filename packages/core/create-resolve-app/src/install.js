const install = pool => async () => {
  const { chalk, console, execSync, applicationPath, useYarn } = pool
  console.log()
  console.log(chalk.green('Install dependencies'))

  const command = `${useYarn ? 'yarn --mutex file' : 'npm install'}`

  for (let retry = 0; retry < 10; retry++) {
    try {
      execSync(command, { stdio: 'inherit', cwd: applicationPath })
    } catch (error) {
      if (
        error != null &&
        error.stderr != null &&
        error.stderr.constructor === String &&
        error.stderr.includes('http://0.0.0.0:10080') &&
        error.stderr.includes('ENOENT: no such file or directory')
      ) {
        continue
      }
      throw error
      break
    }
  }
}

export default install
