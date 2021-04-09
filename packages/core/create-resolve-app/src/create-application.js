import path from 'path'
import message from './message'
import checkApplicationName from './check-application-name'
import downloadResolveRepo from './download-resolve-repo'
import moveExampleToApplicationPath from './move-example'
import patchPackageJson from './patch-package-json'
import install from './install'
import printFinishOutput from './print-finish-output'

const createApplication = async (
  applicationName,
  exampleName,
  localRegistry,
  commit,
  branch
) => {
  // eslint-disable-next-line no-console
  console.log(
    message.startCreatingApp(applicationName, exampleName, commit, branch)
  )
  await checkApplicationName(applicationName)

  const applicationPath = path.join(process.cwd(), applicationName)

  const resolveClonePath = await downloadResolveRepo(
    applicationPath,
    branch,
    commit
  )
  await moveExampleToApplicationPath(
    applicationPath,
    resolveClonePath,
    exampleName
  )
  await patchPackageJson(applicationName, applicationPath, localRegistry)
  await install(applicationPath)
  await printFinishOutput(applicationName)
}

export default createApplication
