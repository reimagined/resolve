import { execSync } from 'child_process'

const isYarnAvailable = () => {
  try {
    execSync('yarn --version', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

export default isYarnAvailable
