const regExp = /require\(("[^"]+?")\)/g

const getVirtualModule = source => {
  return source.replace(
    regExp,
    `(function(req, path){
      var mod = null
      try {
        mod = req(path)
      } catch(err) {
        throw new Error('Module "' + path + '" does not found')
      }
      return mod && mod.__esModule ? mod.default : mod
    })(arguments[2], $1)`
  )
}

export default getVirtualModule
