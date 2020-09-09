import Lambda from 'aws-sdk/clients/lambda'
import STS from 'aws-sdk/clients/sts'

const initAwsClients = async (resolve) => {
  const lambda = new Lambda()
  const sts = new STS()

  Object.assign(resolve, {
    lambda,
    sts,
  })
}

export default initAwsClients
