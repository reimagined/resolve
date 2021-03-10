const testExampleExists = (pool) => async () => {
  const {
    fs,
    path,
    EOL,
    resolveCloneExamplesPath,
    resolveCloneExamplePath,
    exampleName,
  } = pool
  if (fs.existsSync(resolveCloneExamplePath)) {
    return
  }

  const examplesDirs = fs
    .readdirSync(resolveCloneExamplesPath)
    .filter((name) =>
      fs.statSync(path.join(resolveCloneExamplesPath, name)).isDirectory()
    )
    .map((name) => ` * ${name}`)

  throw new Error(
    `No such example, ${exampleName}. The following examples are available: ${EOL}` +
      examplesDirs.join(EOL)
  )
}

export default testExampleExists
