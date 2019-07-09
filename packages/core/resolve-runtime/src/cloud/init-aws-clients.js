import IotData from 'aws-sdk/clients/iotdata'
import Lambda from 'aws-sdk/clients/lambda'
import STS from 'aws-sdk/clients/sts'

const initAwsClients = async resolve => {
  const mqtt = new IotData({
    endpoint: process.env.RESOLVE_WS_ENDPOINT
  })
  const lambda = new Lambda()
  const sts = new STS()

  Object.assign(resolve, {
    lambda,
    mqtt,
    sts
  })
}

export default initAwsClients
