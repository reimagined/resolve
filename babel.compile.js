const path = require('path')
const find = require('glob').sync
const babel = require('@babel/cli/lib/babel/dir')

const files = find("./packages/**/package.json", { ignore: "**/node_modules/**" })

const configs = files.map(
  filePath => {
    const { name, babelCompile } = require(filePath)
    
    if(!Array.isArray(babelCompile)) {
      throw new Error(`[${name}] package.json "babelCompile" must be an array`)
    }
    
    for(let index = 0; index < babelCompile.length; index++) {
      const config = babelCompile[index]
      if(config.moduleType.constructor !== String) {
        throw new Error(`.babelCompile[${index}].moduleType must be a string`)
      }
      if(config.moduleTarget.constructor !== String) {
        throw new Error(`.babelCompile[${index}].moduleTarget must be a string`)
      }
      if(config.inputDir.constructor !== String) {
        throw new Error(`.babelCompile[${index}].inputDir must be a string`)
      }
      if(config.outDir.constructor !== String) {
        throw new Error(`.babelCompile[${index}].outDir must be a string`)
      }

      config.inputDir = path.resolve(path.dirname(filePath), config.inputDir)
      config.outDir = path.resolve(path.dirname(filePath), config.outDir)

      return config
    }
  }
)

console.log(configs)