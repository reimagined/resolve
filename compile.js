const path = require('path')
const find = new require('glob').sync

const files = find("./packages/**/compile.json", { ignore: "**/node_modules/**" })

const configs = files.map(
  filePath => {
    const innerConfigs = require(filePath)
    if(!Array.isArray(innerConfigs)) {
      throw new Error(`File "${filePath}" must be contain an array`)
    }
    for(let index = 0; index < innerConfigs.length; index++) {
      const innerConfig = innerConfigs[index]
      if(innerConfig.moduleType.constructor !== String) {
        throw new Error(`Config[${index}].moduleType must be a String`)
      }
      if(innerConfig.moduleTarget.constructor !== String) {
        throw new Error(`Config[${index}].moduleTarget must be a String`)
      }
      if(innerConfig.inputDir.constructor !== String) {
        throw new Error(`Config[${index}].inputDir must be a String`)
      }
      if(innerConfig.outDir.constructor !== String) {
        throw new Error(`Config[${index}].outDir must be a String`)
      }

      innerConfig.inputDir = path.resolve(path.dirname(filePath), innerConfig.inputDir)
      innerConfig.outDir = path.resolve(path.dirname(filePath), innerConfig.outDir)

      return innerConfig
    }
  }
)

console.log(configs)