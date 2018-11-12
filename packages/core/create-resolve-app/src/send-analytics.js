const sendAnalytics = ({
  https,
  analyticsUrlBase,
  exampleName,
  resolveVersion
}) => () =>
  new Promise((resolve, reject) => {
    const analyticsUrl = `${analyticsUrlBase}/${exampleName}/${resolveVersion}`

    https.get(analyticsUrl, response => {
      response.on('end', resolve)
      response.on('error', reject)
    })
  })

export default sendAnalytics
