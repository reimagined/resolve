import chalk from 'chalk'
import prepareOptions from './prepare-options'
import startCreatingApplication from './start-creating-application'
import checkApplicationName from './check-application-name'
import downloadResolveRepo from './download-resolve-repo'
import testExampleExists from './test-example-exists'
import moveExample from './move-example'
import patchPackageJson from './patch-package-json'
import install from './install'
import printFinishOutput from './print-finish-output'
import sendAnalytics from './send-analytics'

const pipeline = async () => {
  try {
    const {
      analyticsUrlBase,
      resolveVersion,
      resolvePackages,
      applicationName,
      commit,
      branch,
      exampleName,
      applicationPath,
      applicationPackageJsonPath,
      resolveClonePath,
      resolveCloneExamplesPath,
      resolveCloneExamplePath,
      resolveDownloadZipUrl,
      resolveCloneZipPath,
      useYarn,
      localRegistry,
    } = await prepareOptions()

    await startCreatingApplication(applicationName, exampleName, commit, branch)
    await checkApplicationName(applicationName)
    await downloadResolveRepo(
      applicationPath,
      resolveDownloadZipUrl,
      resolveCloneZipPath
    )
    await testExampleExists(
      resolveCloneExamplesPath,
      resolveCloneExamplePath,
      exampleName
    )
    await moveExample(
      applicationPath,
      resolveClonePath,
      resolveCloneExamplePath
    )
    await patchPackageJson(
      applicationName,
      applicationPath,
      applicationPackageJsonPath,
      resolvePackages,
      localRegistry
    )
    await install(applicationPath, useYarn)
    await printFinishOutput(applicationName, useYarn)
    await sendAnalytics(analyticsUrlBase, exampleName, resolveVersion)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(chalk.red(error))
    process.exit(1)
  }
}

export default pipeline
