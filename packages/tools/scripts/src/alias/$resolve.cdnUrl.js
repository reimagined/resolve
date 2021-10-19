import declareRuntimeEnv, { injectRuntimeEnv } from '../declare_runtime_env'

const importCdnUrl = ({ resolveConfig, isClient }) => {
  const exports = []
  if (resolveConfig.hasOwnProperty('uploadAdapter')) {
    exports.push(
      `const cdnUrl = ${injectRuntimeEnv(
        declareRuntimeEnv('RESOLVE_UPLOADER_CDN_URL'),
        isClient
      )}`
    )
  } else {
    exports.push(`const cdnUrl = null`)
  }

  exports.push(`export default cdnUrl`)

  return exports.join('\r\n')
}

export default importCdnUrl
