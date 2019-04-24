// mdis-start
import fs from 'fs'

export default options => {
  const prefix = String(options.prefix)
  const readModels = new Set()
  const connect = async readModelName => {
    fs.writeFileSync(`${prefix}${readModelName}.lock`, true, { flag: 'wx' })
    readModels.add(readModelName)
    const store = {
      get() {
        return JSON.parse(String(fs.readFileSync(`${prefix}${readModelName}`)))
      },
      set(value) {
        fs.writeFileSync(`${prefix}${readModelName}`, JSON.stringify(value))
      }
    }
    return store
  }
  const disconnect = async (store, readModelName) => {
    fs.unlinkSync(`${prefix}${readModelName}.lock`)
    readModels.delete(readModelName)
  }
  const drop = async (store, readModelName) => {
    fs.unlinkSync(`${prefix}${readModelName}.lock`)
    fs.unlinkSync(`${prefix}${readModelName}`)
  }
  const dispose = async () => {
    for (const readModelName of readModels) {
      fs.unlinkSync(`${prefix}${readModelName}.lock`)
    }
    readModels.clear()
  }

  return {
    connect,
    disconnect,
    drop,
    dispose
  }
}
// mdis-stop
