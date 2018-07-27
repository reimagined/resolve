import { defaultResolveConfig } from 'resolve-scripts'

export default () => {
  const config = {
    ...defaultResolveConfig,

    port: 3000,
    routes: 'client/routes.js'
  }

  const launchMode = process.argv[2]

  switch (launchMode) {
    case 'start':
    case 'build':
      return {
        ...config,
        mode: 'production'
      }

    default:
      return {
        ...config,
        mode: 'development'
      }
  }
}
