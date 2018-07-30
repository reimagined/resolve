import defaultResolveConfig from './default.resolve.config'
import declareRuntimeEnv from './declare_runtime_env'
import invokeWebpack from './webpack'

const build = invokeWebpack.bind(null, {
  build: true,
  start: false,
  watch: false,
  openBrowser: false
})

const start = invokeWebpack.bind(null, {
  build: false,
  start: true,
  watch: false,
  openBrowser: false
})

const watch = invokeWebpack.bind(null, {
  build: true,
  start: true,
  watch: true,
  openBrowser: true
})

export { defaultResolveConfig, declareRuntimeEnv, build, start, watch }
