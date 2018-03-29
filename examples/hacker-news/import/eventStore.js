import fs from 'fs'
import path from 'path'
import createEventStore from 'resolve-es'
import createStorage from 'resolve-storage-lite'
import createBus from 'resolve-bus-memory'

const databaseFilePath = path.join(__dirname, '../storage.json')

const storage = createStorage({ pathToFile: databaseFilePath })
const bus = createBus()

export default createEventStore({
  storage,
  bus
})

export const dropStore = () => {
  if (fs.existsSync(databaseFilePath)) {
    fs.unlinkSync(databaseFilePath)
  }
}
