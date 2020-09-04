const sendAnalytics = (pool) => async () => {
  const { https, analyticsUrlBase, exampleName, resolveVersion } = pool
  return await new Promise((resolve, reject) => {
    const analyticsUrl = `${analyticsUrlBase}/${exampleName}/${resolveVersion}`

    https.get(analyticsUrl, (response) => {
      response.on('end', resolve)
      response.on('error', reject)
    })
  })
}

export default sendAnalytics
