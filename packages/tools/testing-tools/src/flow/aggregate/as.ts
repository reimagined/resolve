import { AggregateTestResult, CommandContext } from '../../types'

type AsNode = Promise<AggregateTestResult>

export const as = (context: CommandContext, authToken: string): AsNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(
      `Authorization token cannot be assigned if the test was executed.`
    )
  }

  environment.setAuthToken(authToken)

  return environment.promise
}
