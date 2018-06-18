import fs from 'fs'
import path from 'path'

const resolveFile = query => {
  try {
    const customFilePath = path.resolve(process.cwd(), query)

    if (fs.existsSync(customFilePath)) {
      return customFilePath
    }
  } catch (e) {}

  try {
    const customFilePath = path.resolve(__dirname, '../runtime', query)

    if (fs.existsSync(customFilePath)) {
      return customFilePath
    }
  } catch (e) {}

  throw new Error(`File "${query}" does not exist`)
}

export default resolveFile
