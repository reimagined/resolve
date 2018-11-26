import { message } from '../constants'
import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  let staticPath = resolveConfig.staticPath
  if (staticPath == null) {
    throw new Error(`${message.configNotContainSectionError}.staticPath`)
  }

  const exports = []

  if (!checkRuntimeEnv(staticPath)) {
    if (!validatePath(staticPath, { allowAbsolutePath: true })) {
      throw new Error(
        `Incorrect options.staticPath = "${
          staticPath
          // eslint-disable-next-line max-len
        }"\nValue must be part of the URL or the absolute URL, which is the application's static subdirectory`
      )
    }
    staticPath = encodeURI(staticPath)

    exports.push(
      `const staticPath = ${JSON.stringify(staticPath)}`,
      ``,
      `export default staticPath`
    )
  } else {
    if (!isClient) {
      exports.push(
        `import validatePath from 'resolve-runtime/lib/utils/validate_path'`
      )
    }

    exports.push(`let staticPath = ${injectRuntimeEnv(staticPath, isClient)}`)

    if (!isClient) {
      exports.push(
        /* eslint-disable max-len */
        `if (!validatePath(staticPath, { allowAbsolutePath: true })) {
          throw new Error(
            \`Incorrect options.staticPath = "\${
              staticPath
            }"\\nValue must be part of the URL or the absolute URL, which is the application's static subdirectory\`
          )
        }`,
        /* eslint-enable max-len */
        `staticPath = encodeURI(staticPath)`,
        ``
      )
    }

    exports.push(`export default staticPath`)
  }

  return {
    code: exports.join('\r\n')
  }
}
