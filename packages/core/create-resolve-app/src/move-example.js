import fs from 'fs-extra'
import path from 'path'
import testExampleExists from './test-example-exists'

const moveExample = async (applicationPath, resolveClonePath, exampleName) => {
  const resolveCloneExamplesPath = path.join(resolveClonePath, 'examples')
  const resolveCloneExamplePath = path.join(
    resolveCloneExamplesPath,
    exampleName
  )
  await testExampleExists(resolveCloneExamplesPath, exampleName)

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
