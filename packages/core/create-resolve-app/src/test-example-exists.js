import fs from 'fs-extra'
import path from 'path'
import message from './message'

const testExampleExists = (resolveCloneExamplesPath, exampleName) => {
  const examplePath = path.join(resolveCloneExamplesPath, exampleName)
  if (fs.existsSync(examplePath)) {
    return
  }

  const examplesDirs = fs
    .readdirSync(resolveCloneExamplesPath)
    .filter((name) =>
      fs.statSync(path.join(resolveCloneExamplesPath, name)).isDirectory()
    )
  throw new Error(message.missingExample(exampleName, examplesDirs))
}

export default testExampleExists
