import { getAccountIdFromLambdaContext } from 'resolve-cloud-common/utils'
import {
  ensureSqsQueue,
  deleteSqsQueue,
  sendMessage,
} from 'resolve-cloud-common/sqs'
import {
  createEventSourceMapping,
  setFunctionTags,
  deleteEventSourceMapping,
  getFunctionTags,
} from 'resolve-cloud-common/lambda'
import { getCallerIdentity } from 'resolve-cloud-common/sts'

const initSubscriber = (resolve, lambdaContext) => {
  const accountId = getAccountIdFromLambdaContext(lambdaContext)
  const { functionName } = lambdaContext
  const region = process.env.AWS_REGION
  const userId = process.env.RESOLVE_USER_ID
  const functionArn = `arn:aws:lambda:${region}:${accountId}:function:${functionName}`

  resolve.eventSubscriberDestination = `arn:aws:sqs:${region}:${accountId}:${userId}`
  resolve.subscriptionsCredentials = {
    applicationLambdaArn: lambdaContext.invokedFunctionArn,
  }

  resolve.sendSqsMessage = async (localQueueName, parameters) => {
    const queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${userId}-${localQueueName}`
    await sendMessage({
      Region: region,
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(parameters),
    })
  }

  resolve.invokeBuildAsync = async (parameters) => {
    await resolve.sendSqsMessage(parameters.eventSubscriber, parameters)
  }

  resolve.ensureQueue = async (name) => {
    const getTags = () => {
      const tags = {
        'resolve-deployment-id': process.env.RESOLVE_DEPLOYMENT_ID,
        'resolve-function-name': functionName,
        'resolve-user-id': userId,
      }

      return tags
    }

    const roleArn = (await getCallerIdentity({ region })).Arn

    await ensureSqsQueue({
      QueueName: `${userId}-${name}`,
      Region: region,
      Policy: {
        Version: '2008-10-17',
        Statement: [
          {
            Action: 'SQS:*',
            Principal: {
              AWS: [roleArn],
            },
            Effect: 'Allow',
          },
        ],
      },
      Tags: getTags(),
    })

    const { UUID } = await createEventSourceMapping({
      Region: region,
      QueueName: `${userId}-${name}`,
      FunctionName: functionName,
    })

    await setFunctionTags({
      Region: region,
      FunctionName: functionArn,
      Tags: {
        [`SQS-${name}`]: UUID,
      },
    })
  }

  resolve.deleteQueue = async (name) => {
    const functionTags = await getFunctionTags({
      Region: region,
      FunctionName: functionArn,
    })
    const UUID = functionTags[`SQS-${name}`]
    const queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${userId}-${name}`

    if (UUID != null) {
      await deleteEventSourceMapping({
        Region: region,
        UUID,
      })
      await deleteSqsQueue({
        Region: region,
        QueueName: `${userId}-${name}`,
        QueueUrl: queueUrl,
      })
    }
  }
}

export default initSubscriber
