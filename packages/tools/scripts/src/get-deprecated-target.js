export const getDeprecatedTarget = (resolveConfig) =>
  resolveConfig.runtime.module === '@resolve-js/runtime-aws-serverless'
    ? 'cloud'
    : 'local'
