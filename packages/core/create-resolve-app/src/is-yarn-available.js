const isYarnAvailable = ({ execSync }) => async () => {
  try {
    execSync('yarn --version', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

export default isYarnAvailable
