import fs from 'fs-extra'
import path from 'path'
import { getAvailableExamples } from './get-available-examples'
import message from './message'

const exampleNameMatch = (exampleName: string, isTypescript: boolean) => {
  const fullName = `${exampleName}-${isTypescript ? 'ts' : 'js'}`
  return ({ name }: { name: string }) =>
    name === exampleName || name === fullName
}

const moveExample = async (
  applicationPath: string,
  resolveClonePath: string,
  exampleName: string,
  useTypescript = false
) => {
  const availableExamples = getAvailableExamples(resolveClonePath)
  const matchName = exampleNameMatch(exampleName, useTypescript)
  const example = availableExamples.find(matchName)
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
