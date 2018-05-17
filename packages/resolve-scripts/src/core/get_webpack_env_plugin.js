import webpack from 'webpack'

import { env as envList } from './constants'

const regExp = /^RESOLVE_/

const getWebpackEnvPlugin = ({ env }) => {
  const defineObject = {}

  for (const envKey of [
    ...Object.keys(env).filter(envKey => regExp.test(envKey)),
    ...Object.keys(envList.options)
  ]) {
    if (env[envKey] !== undefined) {
      defineObject[`process.env.${envKey}`] = JSON.stringify(env[envKey])
    }
  }

  return new webpack.DefinePlugin(defineObject)
}

export default getWebpackEnvPlugin
