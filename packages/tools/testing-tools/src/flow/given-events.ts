import partial from 'lodash.partial'
import { OmitFirstArgument, TestEvent } from '../types'
import { aggregate } from './aggregate/aggregate'
import { readModel } from './read-model'
import { saga } from './saga'

type GivenEventsNode = {
  aggregate: OmitFirstArgument<typeof aggregate>
  readModel: OmitFirstArgument<typeof readModel>
  saga: OmitFirstArgument<typeof saga>
} & PromiseLike<never>

export const givenEvents = (events: TestEvent[] = []): GivenEventsNode => {
  const givenEventsContext = {
    events,
  }
  return {
    aggregate: partial(aggregate, givenEventsContext),
    readModel: partial(readModel, givenEventsContext),
    saga: partial(saga, givenEventsContext),
    then: () => {
      throw Error(
        `Incomplete BDD test configuration! Please, provide an aggregate, a read model or a saga.`
      )
    },
  }
}
