const install = pool => async () => {
  const { chalk, console, execSync, applicationPath, useYarn } = pool
  console.log()
  console.log(chalk.green('Install dependencies'))

  const command = `${useYarn ? 'yarn --mutex file' : 'npm install'}`

  for (let retry = 0; retry < 10; retry++) {
    try {
      execSync(command, { stdout: 'inherit', cwd: applicationPath })
    } catch (error) {
      if (
        error != null &&
        error.stderr != null &&
        error.stderr.toString().includes('http://0.0.0.0:10080') &&
        error.stderr.toString().includes('ENOENT: no such file or directory')
      ) {
        continue
      }
      throw error
    }
  }
}

export default install
