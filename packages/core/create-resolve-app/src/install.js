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
        error.message != null &&
        error.message.constructor === String &&
        error.message.includes('http://0.0.0.0:10080') &&
        error.message.includes('ENOENT: no such file or directory')
      ) {
        continue
      }
      throw error
      break
    }
  }
}

export default install
