import webpack from 'webpack'

const regExp = /^RESOLVE_/

const getWebpackEnvPlugin = ({ env }) => {
  const defineObject = {}

  for (const envKey of Object.keys(env).filter(envKey => regExp.test(envKey))) {
    if (env[envKey] !== undefined) {
      defineObject[`process.env.${envKey}`] = JSON.stringify(env[envKey])
    }
  }

  return new webpack.DefinePlugin(defineObject)
}

export default getWebpackEnvPlugin
