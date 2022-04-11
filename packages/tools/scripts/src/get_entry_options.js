import path from 'path'
import { resolveResource } from './resolve-resource'
import { checkRuntimeEnv } from './declare_runtime_env'

const getEntryOptions = (resolveConfig) => {
  const activeRuntimeModule = (
    resolveResource(
      path.join(resolveConfig.runtime.module, 'lib', 'index.js'),
      { returnResolved: true }
    ) ?? { result: null }
  ).result

  const activeRuntimeOptions = JSON.stringify(
    resolveConfig.runtime.options,
    (key, value) => {
      if (checkRuntimeEnv(value)) {
        return process.env[String(value)] ?? value.defaultValue
      }
      return value
    },
    2
  )

  const runtimeEntry = path.resolve(
    process.cwd(),
    path.join(resolveConfig.distDir, './common/local-entry/local-entry.js')
  )

  return {
    activeRuntimeModule,
    activeRuntimeOptions,
    runtimeEntry,
  }
}

export default getEntryOptions
