import path from 'path'
import fs from 'fs'

export default function resolveFile(query) {
  try {
    const customFilePath = path.resolve(process.cwd(), query)

    if (fs.existsSync(customFilePath)) {
      return customFilePath
    }
  } catch (e) {}

  try {
    const customFilePath = path.resolve(__dirname, '../template', query)

    if (fs.existsSync(customFilePath)) {
      return customFilePath
    }
  } catch (e) {}

  throw new Error(`File "${query}" does not exist`)
}
