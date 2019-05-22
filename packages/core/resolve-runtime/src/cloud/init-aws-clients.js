import IotData from 'aws-sdk/clients/iotdata'
import Lambda from 'aws-sdk/clients/lambda'
import StepFunctions from 'aws-sdk/clients/stepfunctions'
import STS from 'aws-sdk/clients/sts'

const initAwsClients = async resolve => {
  const mqtt = new IotData({
    endpoint: process.env.RESOLVE_WS_ENDPOINT
  })
  const lambda = new Lambda()
  const stepFunctions = new StepFunctions()
  const sts = new STS()

  Object.assign(resolve, {
    lambda,
    mqtt,
    stepFunctions,
    sts
  })
}

export default initAwsClients
