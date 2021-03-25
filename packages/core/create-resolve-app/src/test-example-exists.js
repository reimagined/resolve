import fs from 'fs-extra'
import path from 'path'
import message from './message'

const testExampleExists = (
  resolveCloneExamplesPath,
  resolveCloneExamplePath,
  exampleName
) => {
  if (fs.existsSync(resolveCloneExamplePath)) {
    return
  }

  const examplesDirs = fs
    .readdirSync(resolveCloneExamplesPath)
    .filter((name) =>
      fs.statSync(path.join(resolveCloneExamplesPath, name)).isDirectory()
    )
    .map((name) => ` * ${name}`)

  throw new Error(message.missingExample(exampleName, examplesDirs))
}

export default testExampleExists
