import chalk from 'chalk'
import prepareOptions from './prepare-options'
import createApplication from './create-application'
import sendAnalytics from './send-analytics'

const pipeline = async () => {
  try {
    const {
      applicationName,
      exampleName,
      localRegistry,
      commit,
      branch,
    } = await prepareOptions()

    await createApplication(
      applicationName,
      exampleName,
      localRegistry,
      commit,
      branch
    )

    await sendAnalytics(exampleName)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(chalk.red(error))
    process.exit(1)
  }
}

export default pipeline
