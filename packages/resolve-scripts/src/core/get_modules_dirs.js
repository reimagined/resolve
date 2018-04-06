import path from 'path'

import getMonorepoNodeModules from './get_monorepo_node_modules'

const getModulesDirs = () => [
  path.resolve(process.cwd(), 'node_modules'),
  path.resolve(__dirname, '../../node_modules'),
  ...getMonorepoNodeModules()
]

export default getModulesDirs
