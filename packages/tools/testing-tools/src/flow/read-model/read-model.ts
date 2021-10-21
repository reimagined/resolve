import partial from 'lodash.partial'
import {
  TestReadModel,
  GivenEventsContext,
  OmitFirstArgument,
  ReadModelContext,
} from '../../types'
import { query } from './query'
import { withAdapter } from './with-adapter'
import { withEncryption } from './with-encryption'

type DeprecatedResolverMap = {
  [key: string]: Function
}

export type ReadModelNode = {
  query: OmitFirstArgument<typeof query>
  withAdapter: OmitFirstArgument<typeof withAdapter>
  withEncryption: OmitFirstArgument<typeof withEncryption>
} & PromiseLike<never> &
  DeprecatedResolverMap

export const readModel = (
  givenEventsContext: GivenEventsContext,
  readModel: TestReadModel
): ReadModelNode => {
  const context: ReadModelContext = {
    ...givenEventsContext,
    readModel,
  }

  return {
    query: partial(query, context),
    withAdapter: partial(withAdapter, context),
    withEncryption: partial(withEncryption, context),
    then: () => {
      throw Error(`Incomplete BDD test configuration! Please, provide a query.`)
    },
  }
}
