const filterEnvVariablesRegex = /^RESOLVE_|^NODE_ENV$|^ROOT_PATH$/

export default function getClientEnv() {
  return Object.keys(process.env)
    .filter(key => filterEnvVariablesRegex.test(key))
    .reduce((result, key) => {
      result[key] = process.env[key]
      return result
    }, {})
}
