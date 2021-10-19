// mdis-start
import fs from 'fs'

const safeUnlinkSync = (filename) => {
  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename)
  }
}

const connector = (options) => {
  const prefix = String(options.prefix)
  const readModels = new Set()
  // mdis-start connect
  const connect = async (readModelName) => {
    fs.writeFileSync(`${prefix}${readModelName}.lock`, 'true', { flag: 'wx' })
    readModels.add(readModelName)
    const store = {
      get() {
        return JSON.parse(String(fs.readFileSync(`${prefix}${readModelName}`)))
      },
      set(value) {
        fs.writeFileSync(`${prefix}${readModelName}`, JSON.stringify(value))
      },
    }
    return store
  }
  // mdis-stop connect
  // mdis-start disconnect
  const disconnect = async (store, readModelName) => {
    safeUnlinkSync(`${prefix}${readModelName}.lock`)
    readModels.delete(readModelName)
  }
  // mdis-stop disconnect
  // mdis-start drop
  const drop = async (store, readModelName) => {
    safeUnlinkSync(`${prefix}${readModelName}.lock`)
    safeUnlinkSync(`${prefix}${readModelName}`)
  }
  // mdis-stop drop
  // mdis-start dispose
  const dispose = async () => {
    for (const readModelName of readModels) {
      safeUnlinkSync(`${prefix}${readModelName}.lock`)
    }
    readModels.clear()
  }
  // mdis-stop dispose
  return {
    connect,
    disconnect,
    drop,
    dispose,
  }
}
// mdis-stop

export default connector
