import validateProjectName from 'validate-npm-package-name'
import message from './message'

const checkApplicationName = async (applicationName: string) => {
  const result = validateProjectName(applicationName)
  if (!result.validForNewPackages) {
    throw message.invalidApplicationName(
      applicationName,
      result.errors,
      result.warnings
    )
  }
}

export default checkApplicationName
