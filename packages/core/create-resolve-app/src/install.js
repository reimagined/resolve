const install = ({
  chalk,
  console,
  execSync,
  applicationPath,
  useYarn
}) => async () => {
  console.log()
  console.log(chalk.green('Install dependencies'))

  const command = `${useYarn ? 'yarn' : 'npm install'}`

  execSync(command, { stdio: 'inherit', cwd: applicationPath })
}

export default install
