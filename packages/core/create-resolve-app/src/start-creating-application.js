import message from './message'

const startCreatingApplication = async (
  applicationName,
  exampleName,
  commit,
  branch
) => {
  console.log(
    message.startCreatingApp(applicationName, exampleName, commit, branch)
  )
}

export default startCreatingApplication
