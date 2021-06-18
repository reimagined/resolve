import fs from 'fs-extra'
import path from 'path'
import { getAvailableExamples } from './get-available-examples'
import message from './message'

const moveExample = async (applicationPath, resolveClonePath, exampleName) => {
  const availableExamples = getAvailableExamples(resolveClonePath)
  const example = availableExamples.find((x) => x.name === exampleName)
  if (!example) {
    throw new Error(message.missingExample(exampleName, availableExamples))
  }

  const examplePath = path.join(resolveClonePath, example.path)

  for (const resource of fs.readdirSync(examplePath)) {
    fs.moveSync(
      path.join(examplePath, resource),
      path.join(applicationPath, resource),
      { overwrite: true }
    )
  }

  fs.removeSync(resolveClonePath)
}

export default moveExample
