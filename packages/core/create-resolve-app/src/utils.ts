import { execSync } from 'child_process'

export const isYarnAvailable = () => {
  try {
    execSync('yarn --version', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

export const safeName = (name: string) =>
  name.replace(/@/, '').replace(/[/|\\]/g, '-')

export const loadPackageJson = (
  packageJsonPath: string
): { [key: string]: any } => {
  return require(packageJsonPath)
}
