const testExampleExists = ({
  fs,
  path,
  EOL,
  resolveCloneExamplesPath,
  resolveCloneExamplePath,
  exampleName
}) => async () => {
  if (fs.existsSync(resolveCloneExamplePath)) {
    return
  }

  const examplesDirs = fs
    .readdirSync(resolveCloneExamplesPath)
    .filter(name =>
      fs.statSync(path.join(resolveCloneExamplesPath, name)).isDirectory()
    )
    .map(name => ` * ${name}`)

  throw new Error(
    `No such example, ${exampleName}. Available examples are: ${EOL}` +
      examplesDirs.join(EOL)
  )
}

export default testExampleExists
