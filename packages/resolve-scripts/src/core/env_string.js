const envReplaceRegexp = /\$({)?([a-z0-9_]+)(:-[^}]+)?(})?/gi

const envString = (str, env) =>
  str.replace(envReplaceRegexp, (_, __, key) => {
    if (!env.hasOwnProperty(key)) {
      throw new Error(`Environment variable ${key} is not defined`)
    }
    return env[key]
  })

export default envString
