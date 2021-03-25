import https from 'https'
const sendAnalytics = async (analyticsUrlBase, exampleName, resolveVersion) => {
  return await new Promise((resolve, reject) => {
    const analyticsUrl = `${analyticsUrlBase}/${exampleName}/${resolveVersion}`

    https.get(analyticsUrl, (response) => {
      response.on('end', resolve)
      response.on('error', reject)
    })
  })
}

export default sendAnalytics
