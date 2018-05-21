import JSON5 from 'json5'
import envString from 'env-string'
import envExtract from 'json-env-extract'

const parseResolveConfigJson = (configAsText, { env, deployOptions }) => {
  const { text, envs } = envExtract(
    envString(configAsText, env),
    '$ref/deployOptions/env/'
  )

  const config = JSON5.parse(text)

  deployOptions.env = envs

  return config
}

export default parseResolveConfigJson
