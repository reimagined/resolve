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
  invokeFunction,
} from 'resolve-cloud-common/lambda'
import { getCallerIdentity } from 'resolve-cloud-common/sts'

export const checkError = (error, value) =>
  error != null &&
  ((error.message != null &&
    error.message.constructor === String &&
    error.message.indexOf(`${value}`) > -1) ||
    (error.stack != null &&
      error.stack.constructor === String &&
      error.stack.indexOf(`${value}`) > -1) ||
    error.name === `${value}` ||
    error.code === `${value}`)

export const isRetryableServiceError = (error) =>
  checkError(error, 'TooManyRequestsException') ||
  checkError(error, 'ServiceException')

const initSubscriber = (resolve, lambdaContext) => {
  const accountId = getAccountIdFromLambdaContext(lambdaContext)
  const { functionName } = lambdaContext
  const region = process.env.AWS_REGION
  const userId = process.env.RESOLVE_USER_ID
  const functionArn = `arn:aws:lambda:${region}:${accountId}:function:${functionName}`
  const useSqs = !!process.env.EXPERIMENTAL_SQS_TRANSPORT

  resolve.getEventSubscriberDestination = (eventSubscriber) =>
    useSqs
      ? `arn:aws:sqs:${region}:${accountId}:${userId}-${resolve.eventSubscriberScope}-${eventSubscriber}`
      : functionArn

  resolve.subscriptionsCredentials = {
    applicationLambdaArn: lambdaContext.invokedFunctionArn,
  }

  resolve.invokeLambdaAsync = async (destination, parameters) => {
    try {
      await invokeFunction({
        Region: region,
        FunctionName: destination,
        Payload: parameters,
        InvocationType: 'RequestResponse',
        MaximumExecutionDuration: 500,
      })
    } catch (error) {}
  }

  resolve.sendSqsMessage = async (destination, parameters) => {
    const queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${destination}`
    await sendMessage({
      Region: region,
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(parameters),
    })
  }

  resolve.invokeBuildAsync = async (parameters) =>
    useSqs
      ? await resolve.sendSqsMessage(
          `${userId}-${resolve.eventSubscriberScope}-${parameters.eventSubscriber}`,
          parameters
        )
      : await resolve.invokeLambdaAsync(functionName, {
          resolveSource: 'BuildEventSubscriber',
          ...parameters,
        })

  resolve.ensureQueue = async (name) => {
    if (!useSqs) {
      return
    }
    const getTags = () => {
      const tags = {
        'resolve-deployment-id': resolve.eventSubscriberScope,
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
      while (true) {
        try {
          await ensureSqsQueue({
            QueueName: `${userId}-${resolve.eventSubscriberScope}-${name}`,
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
          break
        } catch (error) {
          if (checkError(error, 'QueueAlreadyExists')) {
            break
          }
          if (
            !(
              isRetryableServiceError(error) ||
              checkError(
                error,
                'AWS.SimpleQueueService.QueueDeletedRecently'
              ) ||
              checkError(error, 'QueueDeletedRecently')
            )
          ) {
            throw error
          }
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    } catch (err) {
      errors.push(err)
    }

    try {
      while (true) {
        try {
          void ({ UUID } = await createEventSourceMapping({
            Region: region,
            QueueName: `${userId}-${resolve.eventSubscriberScope}-${name}`,
            FunctionName: functionName,
            MaximumBatchingWindowInSeconds: 0,
            BatchSize: 10,
          }))
          break
        } catch (error) {
          if (checkError(error, 'ResourceConflictException')) {
            break
          }
          if (!isRetryableServiceError(error)) {
            throw error
          }
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    } catch (err) {
      errors.push(err)
    }

    if (UUID != null) {
      try {
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
            if (!isRetryableServiceError(error)) {
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
            [`SQS-${resolve.eventSubscriberScope}-${name}`]: UUID,
          },
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

  resolve.deleteQueue = async (name) => {
    if (!useSqs) {
      return
    }
    const errors = []
    let functionTags = null
    let UUID = null
    let queueUrl = null

    try {
      functionTags = await getFunctionTags({
        Region: region,
        FunctionName: functionArn,
      })
      UUID = functionTags[`SQS-${resolve.eventSubscriberScope}-${name}`]
      queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${userId}-${resolve.eventSubscriberScope}-${name}`
    } catch (err) {
      errors.push(err)
    }

    if (UUID != null) {
      try {
        while (true) {
          try {
            await deleteEventSourceMapping({
              Region: region,
              UUID,
            })
            break
          } catch (error) {
            if (checkError(error, 'ResourceNotFoundException')) {
              break
            }
            if (
              !(
                isRetryableServiceError(error) ||
                checkError(error, 'ResourceInUseException')
              )
            ) {
              throw error
            }
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
      } catch (err) {
        errors.push(err)
      }

      try {
        while (true) {
          try {
            await getEventSourceMapping({ Region: region, UUID })
            const error = new Error('ResourceAlreadyExists')
            error.code = 'ResourceAlreadyExists'
            throw error
          } catch (error) {
            if (checkError(error, 'ResourceNotFoundException')) {
              break
            }
            if (
              !(
                isRetryableServiceError(error) ||
                checkError(error, 'ResourceAlreadyExists')
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
        while (true) {
          try {
            await deleteSqsQueue({
              Region: region,
              QueueName: `${userId}-${resolve.eventSubscriberScope}-${name}`,
              QueueUrl: queueUrl,
            })
            break
          } catch (error) {
            if (checkError(error, 'Failed to delete SQS queue')) {
              break
            }
            if (!isRetryableServiceError(error)) {
              throw error
            }
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
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
