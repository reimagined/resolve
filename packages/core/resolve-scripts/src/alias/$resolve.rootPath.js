import validatePath from 'resolve-runtime/lib/common/utils/validate-path'

import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  let rootPath = resolveConfig.rootPath
  const exports = []

  if (!checkRuntimeEnv(rootPath)) {
    if (!validatePath(rootPath, { allowEmptyPath: true })) {
      throw new Error(
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
        `import validatePath from 'resolve-runtime/lib/common/utils/validate-path'`
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
