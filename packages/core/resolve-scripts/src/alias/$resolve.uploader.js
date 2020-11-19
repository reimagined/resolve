import { injectRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  const imports = [!isClient ? `import '$resolve.guardOnlyServer'` : '']
  const constants = []
  const exports = [`export default uploader`]

  if (resolveConfig.hasOwnProperty('uploader')) {
    constants.push(
      !isClient
        ? `const originalUploader = ${injectRuntimeEnv(resolveConfig.uploader)}`
        : `const originalUploader = {}`
    )

    if (resolveConfig.target === 'cloud') {
      exports.push(
        `const CDN = ${injectRuntimeEnv(resolveConfig.uploader.CDN, isClient)}
        const deploymentId = ${injectRuntimeEnv(
          resolveConfig.uploader.deploymentId,
          isClient
        )}
        const CDNUrl = \`https://\${CDN}/\${deploymentId}\`,
        `
      )
    } else if (resolveConfig.target === 'local') {
      constants.push(`const CDNUrl = 'http://localhost:3000/uploader'`)
    }

    constants.push(`const uploader = { ...originalUploader, CDNUrl }`)
  } else {
    constants.push(`const uploader = null`)
  }

  return [...imports, ...constants, ...exports].join('\r\n')
}
