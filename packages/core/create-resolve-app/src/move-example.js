import fs from 'fs-extra'
import path from 'path'

const moveExample = async (
  applicationPath,
  resolveClonePath,
  resolveCloneExamplePath
) => {
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
