import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'

const importBabel = pathToModule => {
  require('@babel/register')

  const requiredModule = require(pathToModule)

  return interopRequireDefault(requiredModule).default
}

export default importBabel
