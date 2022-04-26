const cloudConfig = {
  mode: 'production',
  runtime: {
    module: '@resolve-js/runtime-aws-serverless',
    options: {
      importMode: 'dynamic',
    },
  },
}

export default cloudConfig
