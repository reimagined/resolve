import defaultResolveConfig from '../configs/default.resolve.config.json'
import declareRuntimeEnv from './declare_runtime_env'

import getModulesDirs from './get_modules_dirs'
import getWebpackEnvPlugin from './get_webpack_env_plugin'

import start from './start_mode'
import build from './build_mode'
import watch from './watch_mode'
import runTestcafe from './run_testcafe'
import merge from './merge'

export {
  defaultResolveConfig,
  declareRuntimeEnv,
  getModulesDirs,
  getWebpackEnvPlugin,
  build,
  start,
  watch,
  runTestcafe,
  merge
}
