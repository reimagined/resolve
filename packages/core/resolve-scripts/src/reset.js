import fetch from 'isomorphic-fetch'
import prepareUrls from './prepare_urls'

const validOptions = [
  'dropEventStore',
  'dropSnapshots',
  'dropReadModels',
  'dropSagas'
]

const reset = async (resolveConfig, options) => {
  if (options == null || options.constructor !== Object) {
    throw new Error('Invalid reset options')
  }
  let currentOptions = []
  for (const key of Object.keys(options)) {
    if (
      !validOptions.includes(key) ||
      options[key] == null ||
      options[key].constructor !== Boolean
    ) {
      throw new Error(`Invalid reset options: ${key}`)
    }
    currentOptions.push(`${key}=${options[key]}`)
  }

  const urls = prepareUrls(
    'http',
    '0.0.0.0',
    resolveConfig.port,
    resolveConfig.rootPath
  )
  const baseUrl = urls.localUrlForBrowser
  const url = `${baseUrl}api/reset-domain?${currentOptions.join('&')}`

  while (true) {
    try {
      const response = await fetch(url)
      if ((await response.text()) === 'ok') break
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (e) {}
  }
}

export default reset
