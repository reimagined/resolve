import { getAccountIdFromLambdaContext } from 'resolve-cloud-common/utils'
import {
  ensureSqsQueue,
  deleteSqsQueue,
  sendMessage,
} from 'resolve-cloud-common/sqs'
import {
  createEventSourceMapping,
  getEventSourceMapping,
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
    const queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${userId}-${resolve.applicationName}-${localQueueName}`
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
    const errors = []
    let roleArn = null
    let UUID = null
    try {
      roleArn = (await getCallerIdentity({ region })).Arn
    } catch (err) {
      errors.push(err)
    }

    try {
      await ensureSqsQueue({
        QueueName: `${userId}-${resolve.applicationName}-${name}`,
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
    } catch (err) {
      errors.push(err)
    }

    try {
      void ({ UUID } = await createEventSourceMapping({
        Region: region,
        QueueName: `${userId}-${resolve.applicationName}-${name}`,
        FunctionName: functionName,
        MaximumBatchingWindowInSeconds: 0,
        BatchSize: 10,
      }))
      while (true) {
        try {
          const { State } = await getEventSourceMapping({
            Region: region,
            UUID,
          })
          if (State === 'Enabled') {
            break
          }
        } catch (error) {
          if (
            !(
              error != null &&
              (error.code === 'ResourceInUseException' ||
                error.code === 'TooManyRequestsException' ||
                error.code === 'ServiceException')
            )
          ) {
            throw error
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (err) {
      errors.push(err)
    }

    try {
      await setFunctionTags({
        Region: region,
        FunctionName: functionArn,
        Tags: {
          [`SQS-${resolve.applicationName}-${name}`]: UUID,
        },
      })
    } catch (err) {
      errors.push(err)
    }

    if (errors.length > 0) {
      const summaryError = new Error(
        errors.map(({ message }) => message).join('\n')
      )
      summaryError.stack = errors.map(({ stack }) => stack).join('\n')
      throw summaryError
    }
  }

  resolve.deleteQueue = async (name) => {
    const errors = []
    let functionTags = null
    let UUID = null
    let queueUrl = null

    try {
      functionTags = await getFunctionTags({
        Region: region,
        FunctionName: functionArn,
      })
      UUID = functionTags[`SQS-${resolve.applicationName}-${name}`]
      queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${userId}-${resolve.applicationName}-${name}`
    } catch (err) {
      errors.push(err)
    }

    if (UUID != null) {
      try {
        await deleteEventSourceMapping({
          Region: region,
          UUID,
        })

        while (true) {
          try {
            await getEventSourceMapping({ Region: region, UUID })
            const error = new Error('ResourceAlreadyExists')
            error.code = 'ResourceAlreadyExists'
            throw error
          } catch (error) {
            if (error != null && error.code === 'ResourceNotFoundException') {
              break
            }

            if (
              !(
                error != null &&
                (error.code === 'ResourceNotFoundException' ||
                  error.code === 'ResourceInUseException' ||
                  error.code === 'TooManyRequestsException' ||
                  error.code === 'ServiceException')
              )
            ) {
              throw error
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      } catch (err) {
        errors.push(err)
      }
      try {
        await deleteSqsQueue({
          Region: region,
          QueueName: `${userId}-${resolve.applicationName}-${name}`,
          QueueUrl: queueUrl,
        })
      } catch (err) {
        errors.push(err)
      }
    }

    if (errors.length > 0) {
      const summaryError = new Error(
        errors.map(({ message }) => message).join('\n')
      )
      summaryError.stack = errors.map(({ stack }) => stack).join('\n')
      throw summaryError
    }
  }
}

export default initSubscriber
