import validatePath from 'resolve-runtime/lib/utils/validate_path'

import { message } from '../constants'
import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  let rootPath = resolveConfig.rootPath
  if (rootPath == null) {
    throw new Error(`${message.configNotContainSectionError}.rootPath`)
  }
  const exports = []

  if (!checkRuntimeEnv(rootPath)) {
    if (!validatePath(rootPath, { allowEmptyPath: true })) {
      throw new Error(
        // eslint-disable-next-line max-len
        `Incorrect options.rootPath = "${rootPath}"\nValue must be part of the URL, which is the application's subdirectory`
      )
    }
    rootPath = encodeURI(rootPath)

    exports.push(
      `const rootPath = ${JSON.stringify(rootPath)}`,
      ``,
      `export default rootPath`
    )
  } else {
    if (!isClient) {
      exports.push(
        `import validatePath from 'resolve-runtime/lib/utils/validate_path'`
      )
    }

    exports.push(`let rootPath = ${injectRuntimeEnv(rootPath, isClient)}`)

    if (!isClient) {
      exports.push(
        `if (!validatePath(rootPath, { allowEmptyPath: true })) {
          throw new Error(
            \`Incorrect options.rootPath = "\${
              rootPath
            }"\\nValue must be part of the URL, which is the application's subdirectory\`
          )
        }`,
        ``,
        `rootPath = encodeURI(rootPath)`,
        ``
      )
    }

    exports.push(`export default rootPath`)
  }

  return {
    code: exports.join('\r\n')
  }
}
