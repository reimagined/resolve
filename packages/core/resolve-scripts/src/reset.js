import fetch from 'isomorphic-fetch'
import prepareUrls from './prepare_urls'
import injectResetter from './inject_resetter'

const validOptions = [
  'dropEventStore',
  'dropSnapshots',
  'dropReadModels',
  'dropSagas'
]

const reset = async (resolveConfig, options) => {
  injectResetter(resolveConfig)
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
      const text = await response.text()
      if (text === 'ok') break
    } catch (e) {}
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

export default reset
