import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'

const copyEnvToDist = distDir => {
  const pathToEnv = path.resolve(process.cwd(), '.env')

  if (fs.existsSync(pathToEnv)) {
    fsExtra.copySync(
      pathToEnv,
      path.resolve(process.cwd(), distDir, 'common', '.env')
    )
  }
}

export default copyEnvToDist
