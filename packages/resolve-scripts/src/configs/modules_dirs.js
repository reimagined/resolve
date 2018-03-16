import path from 'path'

import getMonorepoNodeModules from '../utils/get_monorepo_node_modules'

export default [
  path.resolve(process.cwd(), 'node_modules'),
  ...getMonorepoNodeModules(),
  path.resolve(__dirname, '../../node_modules')
]
