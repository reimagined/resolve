const moveExample = ({
  fs,
  path,
  applicationPath,
  resolveClonePath,
  resolveCloneExamplePath
}) => async () => {
  for (const resource of fs.readdirSync(resolveCloneExamplePath)) {
    fs.moveSync(
      path.join(resolveCloneExamplePath, resource),
      path.join(applicationPath, resource),
      { overwrite: true }
    )
  }

  fs.removeSync(resolveClonePath)
}

export default moveExample
