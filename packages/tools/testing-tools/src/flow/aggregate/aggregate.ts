import partial from 'lodash.partial'
import {
  BDDAggregate,
  GivenEventsContext,
  OmitFirstArgument,
} from '../../types'
import { command } from './command'

type AggregateNode = {
  command: OmitFirstArgument<typeof command>
} & PromiseLike<never>

export const aggregate = (
  context: GivenEventsContext,
  aggregate: BDDAggregate,
  aggregateId?: string
): AggregateNode => {
  const aggregateContext = {
    ...context,
    aggregate,
    aggregateId,
  }

  return {
    command: partial(command, aggregateContext),
    then: () => {
      throw Error(
        `Incomplete BDD test configuration! Please, provide a command.`
      )
    },
  }
}
