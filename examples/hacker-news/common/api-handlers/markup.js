const liveRequire = filePath => {
  // eslint-disable-next-line no-eval
  const resource = eval(`require(${JSON.stringify(filePath)})`)
  // eslint-disable-next-line no-eval
  eval(`delete require.cache[require.resolve(${JSON.stringify(filePath)})]`)
  return resource
}

const markup = async (req, res) => {
  try {
    const ssrHandlerFile = liveRequire(`../../client/ssr.js`)
    const ssrHandler = ssrHandlerFile.default
    await ssrHandler(req, res)
  } catch (error) {
    res.end(`SSR is not ready: ${error.message}`)
  }
}

export default markup
