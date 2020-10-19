import { invokeFunction } from 'resolve-cloud-common/lambda'

const invokeEventBus = async (type, options) => {
  return await invokeFunction({
    Region: process.env.AWS_REGION,
    FunctionName: process.env.EVENT_BUS_LAMBDA_ARN,
    Payload: {
      type,
      payload: options,
    },
  })
}

export default invokeEventBus
