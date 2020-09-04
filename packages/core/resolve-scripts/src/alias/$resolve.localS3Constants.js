import { injectRuntimeEnv } from '../declare_runtime_env';

export default ({ resolveConfig, isClient }) => {
  const exports = [];

  if (resolveConfig.hasOwnProperty('uploadAdapter')) {
    if (resolveConfig.uploadAdapter.module === 'resolve-upload-local') {
      exports.push(
        `const localS3Constants = {
        CDNUrl: 'http://localhost:3000/uploader'
      }`,
        ``,
        `export default localS3Constants`
      );
    } else {
      const { CDN, deploymentId } = resolveConfig.uploadAdapter.options;
      exports.push(
        `const CDN = ${injectRuntimeEnv(CDN, isClient)}
        const deploymentId = ${injectRuntimeEnv(deploymentId, isClient)}
                
        const localS3Constants = {
        CDNUrl: \`https://\${CDN}/\${deploymentId}\`
      }`,
        ``,
        `export default localS3Constants`
      );
    }
  }

  return exports.join('\r\n');
};
