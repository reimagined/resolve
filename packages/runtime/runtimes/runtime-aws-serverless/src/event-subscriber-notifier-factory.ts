import type { EventSubscriberNotifier } from '@resolve-js/runtime-base'
import {
  createEventSubscriberNotification,
  getLog,
  pureRequire,
} from '@resolve-js/runtime-base'
import { EventSubscriberInterface } from './types'

type NotifierRuntime = {
  //TODO: types
  sendSqsMessage: Function
  invokeLambdaAsync: Function
}

export const LAMBDA_TO_STEP_FUNCTION_COST_EXPENSE_THRESHOLD_MS = 3000

export const waitForSubscriber = async (isSaga = false) =>
  await new Promise((resolve) => setTimeout(resolve, isSaga ? 10000 : 1000))

export const checkError = (error: any, value: string) =>
  error != null &&
  ((error.message != null &&
    error.message.constructor === String &&
    error.message.indexOf(`${value}`) > -1) ||
    (error.stack != null &&
      error.stack.constructor === String &&
      error.stack.indexOf(`${value}`) > -1) ||
    error.name === `${value}` ||
    error.code === `${value}`)

export const isRetryableServiceError = (error: any) =>
  checkError(error, 'TooManyRequestsException') ||
  checkError(error, 'ServiceException')

// TODO: unnecessary destination round trip
const notifyEventSubscriber: (
  runtime: NotifierRuntime,
  ...args: Parameters<EventSubscriberNotifier>
) => Promise<void> = async (
  runtime: NotifierRuntime,
  destination,
  eventSubscriber,
  event?
) => {
  const log = getLog(
    `notifyEventSubscriber:${eventSubscriber}:${
      event?.event.type ?? '_NO_EVENT_'
    }`
  )
  if (/^arn:aws:sqs:/.test(destination)) {
    log.debug(`sending SQS message`)
    const queueFullName = destination.split(':')[5]
    await runtime.sendSqsMessage(
      queueFullName,
      createEventSubscriberNotification(eventSubscriber, event, true)
    )
  } else if (/^arn:aws:lambda:/.test(destination)) {
    log.debug(`invoking lambda directly`)
    const lambdaFullName = destination.split(':')[6]
    await runtime.invokeLambdaAsync(lambdaFullName, {
      resolveSource: 'BuildEventSubscriber',
      ...createEventSubscriberNotification(eventSubscriber, event, true),
    })
  } else {
    log.warn(
      `event subscriber destination not supported by runtime: ${destination}`
    )
  }
}

type EventSubscriberNotifierFactoryParameters = {
  lambdaContext: {
    invokedFunctionArn: string
    functionName: string
  }
  eventSubscriberScope: string
}

export const eventSubscriberNotifierFactory = async (
  params: EventSubscriberNotifierFactoryParameters
): Promise<EventSubscriberInterface> => {
  const { lambdaContext, eventSubscriberScope } = params
  let getAccountIdFromLambdaContext: any
  try {
    getAccountIdFromLambdaContext = pureRequire('resolve-cloud-common/utils')
  } catch {}

  const accountId = getAccountIdFromLambdaContext(lambdaContext)
  const { functionName } = lambdaContext
  const region = process.env.AWS_REGION as string
  const userId = process.env.RESOLVE_USER_ID as string
  const functionArn = `arn:aws:lambda:${region}:${accountId}:function:${functionName}`
  const useSqs = !!process.env.EXPERIMENTAL_SQS_TRANSPORT
  const getNotifierLog = (scope: string) =>
    getLog(`subscriberNotifier:${scope}`)

  const invokeLambdaAsync = async (
    destination: string,
    parameters: Record<string, any>
  ) => {
    const log = getNotifierLog(`invokeLambdaAsync`)
    log.debug(`invoking lambda as event subscriber: ${destination}`)
    let invokeFunction: any
    try {
      invokeFunction = pureRequire('resolve-cloud-common/lambda')
    } catch {}
    await invokeFunction({
      Region: region,
      FunctionName: destination,
      Payload: parameters,
      InvocationType: 'RequestOnly',
      MaximumExecutionDuration: 200,
    })
  }

  const sendSqsMessage = async (
    destination: string,
    parameters: Record<string, any>
  ) => {
    const log = getNotifierLog(`sendSqsMessage`)
    log.debug(`sending SQS message to: ${destination}`)
    const queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${destination}`
    let sendMessage: any
    try {
      sendMessage = pureRequire('resolve-cloud-common/sqs')
    } catch {}
    await sendMessage({
      Region: region,
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(parameters),
    })
  }

  const getEventSubscriberDestination = (eventSubscriber: string) =>
    useSqs
      ? `arn:aws:sqs:${region}:${accountId}:${userId}-${eventSubscriberScope}-${eventSubscriber}`
      : functionArn

  const invokeBuildAsync = async (
    parameters: { eventSubscriber: string },
    timeout?: number
  ) => {
    if (useSqs) {
      return await sendSqsMessage(
        `${userId}-${eventSubscriberScope}-${parameters.eventSubscriber}`,
        parameters
      )
    }
    const lambdaEvent = {
      resolveSource: 'BuildEventSubscriber',
      ...parameters,
    }
    if (
      timeout == null ||
      timeout < LAMBDA_TO_STEP_FUNCTION_COST_EXPENSE_THRESHOLD_MS
    ) {
      await new Promise((resolve) => setTimeout(resolve, timeout))
      await invokeLambdaAsync(functionName, lambdaEvent)
    } else {
      let STS: any
      try {
        STS = pureRequire('aws-sdk/clients/sts')
      } catch {}
      const { Arn } = await new STS().getCallerIdentity().promise()
      let invokeFunction: any
      try {
        invokeFunction = pureRequire('resolve-cloud-common/lambda')
      } catch {}
      await invokeFunction({
        Region: process.env.AWS_REGION as string,
        FunctionName: process.env.RESOLVE_SCHEDULER_LAMBDA_ARN as string,
        Payload: {
          functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
          event: lambdaEvent,
          date: new Date(Date.now() + timeout).toISOString(),
          validationRoleArn: Arn,
          principial: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN,
          },
        },
      })
    }
  }

  const ensureQueue = async (name?: string) => {
    if (!useSqs) {
      return
    }
    const getTags = () => {
      const tags = {
        'resolve-deployment-id': eventSubscriberScope,
        'resolve-function-name': functionName,
        'resolve-user-id': userId,
      }

      return tags
    }
    const errors = []
    let roleArn: string | null | undefined = null
    let UUID = null
    try {
      let getCallerIdentity: any
      try {
        getCallerIdentity = pureRequire('resolve-cloud-common/sts')
      } catch {}
      roleArn = (await getCallerIdentity({ Region: region })).Arn
    } catch (err) {
      errors.push(err)
    }

    try {
      while (true) {
        try {
          let ensureSqsQueue: any
          try {
            ensureSqsQueue = pureRequire('resolve-cloud-common/sqs')
          } catch {}
          await ensureSqsQueue({
            QueueName: `${userId}-${eventSubscriberScope}-${name}`,
            Region: region,
            Policy: {
              Version: '2008-10-17',
              Statement: [
                {
                  Action: 'SQS:*',
                  Principal: {
                    AWS: [roleArn as string],
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
          await waitForSubscriber()
        }
      }
    } catch (err) {
      errors.push(err)
    }

    try {
      while (true) {
        try {
          let createEventSourceMapping: any
          try {
            createEventSourceMapping = pureRequire(
              'resolve-cloud-common/lambda'
            )
          } catch {}

          void ({ UUID } = await createEventSourceMapping({
            Region: region,
            QueueName: `${userId}-${eventSubscriberScope}-${name}`,
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
          await waitForSubscriber()
        }
      }
    } catch (err) {
      errors.push(err)
    }

    if (UUID != null) {
      try {
        while (true) {
          try {
            let getEventSourceMapping: any
            try {
              getEventSourceMapping = pureRequire('resolve-cloud-common/lambda')
            } catch {}

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
          await waitForSubscriber()
        }
      } catch (err) {
        errors.push(err)
      }

      try {
        let setFunctionTags: any
        try {
          setFunctionTags = pureRequire('resolve-cloud-common/lambda')
        } catch {}
        await setFunctionTags({
          Region: region,
          FunctionName: functionArn,
          Tags: {
            [`SQS-${eventSubscriberScope}-${name}`]: UUID,
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

  const deleteQueue = async (name?: string) => {
    if (!useSqs) {
      return
    }
    const errors = []
    let functionTags = null
    let UUID = null
    let queueUrl: string | null = null

    try {
      let getFunctionTags: any
      try {
        getFunctionTags = pureRequire('resolve-cloud-common/lambda')
      } catch {}
      functionTags = await getFunctionTags({
        Region: region,
        FunctionName: functionArn,
      })
      UUID = functionTags[`SQS-${eventSubscriberScope}-${name}`]
      queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${userId}-${eventSubscriberScope}-${name}`
    } catch (err) {
      errors.push(err)
    }

    if (UUID != null) {
      try {
        while (true) {
          try {
            let deleteEventSourceMapping: any
            try {
              deleteEventSourceMapping = pureRequire(
                'resolve-cloud-common/lambda'
              )
            } catch {}

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
            await waitForSubscriber()
          }
        }
      } catch (err) {
        errors.push(err)
      }

      try {
        while (true) {
          try {
            let getEventSourceMapping: any
            try {
              getEventSourceMapping = pureRequire('resolve-cloud-common/lambda')
            } catch {}
            await getEventSourceMapping({ Region: region, UUID })
            const error = new Error('ResourceAlreadyExists')
            ;(error as any).code = 'ResourceAlreadyExists'
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
          await waitForSubscriber()
        }
      } catch (err) {
        errors.push(err)
      }

      try {
        while (true) {
          try {
            let deleteSqsQueue: any
            try {
              deleteSqsQueue = pureRequire('resolve-cloud-common/sqs')
            } catch {}
            await deleteSqsQueue({
              Region: region,
              QueueName: `${userId}-${eventSubscriberScope}-${name}`,
              QueueUrl: queueUrl as string,
            })
            break
          } catch (error) {
            if (checkError(error, 'Failed to delete SQS queue')) {
              break
            }
            if (!isRetryableServiceError(error)) {
              throw error
            }
            await waitForSubscriber()
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

  const notifier = async (...args: Parameters<EventSubscriberNotifier>) =>
    notifyEventSubscriber(
      {
        sendSqsMessage,
        invokeLambdaAsync,
      },
      ...args
    )

  return {
    notifyEventSubscriber: notifier,
    getEventSubscriberDestination,
    ensureQueue,
    deleteQueue,
    invokeBuildAsync,
  }
}
