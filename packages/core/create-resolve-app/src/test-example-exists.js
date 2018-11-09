const testExampleExists = ({
  fs,
  path,
  process,
  EOL,
  applicationName,
  exampleName,
  resolveCloneDirName
}) => {
  const examplesDirs = fs
    .readdirSync(
      path.join(process.cwd(), applicationName, resolveCloneDirName, 'examples')
    )
    .filter(exampleName =>
      fs
        .statSync(
          path.join(
            process.cwd(),
            applicationName,
            resolveCloneDirName,
            'examples',
            exampleName
          )
        )
        .isDirectory()
    )
    .map(exampleName => ` * ${exampleName}`)

  if (
    !fs.existsSync(
      path.join(
        process.cwd(),
        applicationName,
        resolveCloneDirName,
        'examples',
        exampleName
      )
    )
  ) {
    throw new Error(
      `No such example, ${exampleName}. Available examples are: ${EOL}` +
        examplesDirs.join(EOL)
    )
  }
}

export default testExampleExists
