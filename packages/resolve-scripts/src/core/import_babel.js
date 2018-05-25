const importBabel = pathToModule => {
  require('@babel/register')

  const requiredModule = require(pathToModule)

  return requiredModule.default || requiredModule
}

export default importBabel
