import https from 'https'
import { analyticsUrlBase, resolveVersion } from './constants'

const sendAnalytics = async (exampleName) => {
  return await new Promise((resolve, reject) => {
    const analyticsUrl = `${analyticsUrlBase}/${exampleName}/${resolveVersion}`

    https.get(analyticsUrl, (response) => {
      response.on('end', resolve)
      response.on('error', reject)
    })
  })
}

export default sendAnalytics
