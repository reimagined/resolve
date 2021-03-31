import partial from 'lodash.partial'
import {
  BDDReadModel,
  GivenEventsContext,
  OmitFirstArgument,
  ReadModelContext,
} from '../../types'
import { query } from './query'

type ReadModelNode = {
  query: OmitFirstArgument<typeof query>
} & PromiseLike<never>

export const readModel = (
  givenEventsContext: GivenEventsContext,
  readModel: BDDReadModel
): ReadModelNode => {
  const context: ReadModelContext = {
    ...givenEventsContext,
    readModel,
  }

  return {
    query: partial(query, context),
    then: () => {
      throw Error(
        `Incomplete BDD test configuration! Please, provide a command.`
      )
    },
  }
}
