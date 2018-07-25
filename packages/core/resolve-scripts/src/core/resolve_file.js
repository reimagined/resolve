import fs from 'fs'
import path from 'path'

const resolveFile = (query, fallbackQuery) => {
  try {
    const customFilePath = path.resolve(process.cwd(), query)

    if (fs.existsSync(customFilePath)) {
      return customFilePath
    }
  } catch (e) {}

  if (fallbackQuery) {
    const customFilePath = path.resolve(__dirname, '../defaults', fallbackQuery)

    if (fs.existsSync(customFilePath)) {
      return customFilePath
    } else {
      throw new Error(
        `File "${query}" does not exist. Fallback "${customFilePath}" does not exist`
      )
    }
  }

  throw new Error(`File "${query}" does not exist`)
}

export default resolveFile
