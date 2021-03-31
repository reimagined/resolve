import partial from 'lodash.partial'
import {
  BDDReadModel,
  GivenEventsContext,
  OmitFirstArgument,
  ReadModelContext,
} from '../../types'
import { query } from './query'

type DeprecatedResolverMap = {
  [key: string]: Function
}

type ReadModelNode = {
  query: OmitFirstArgument<typeof query>
} & PromiseLike<never> &
  DeprecatedResolverMap

const makeDeprecatedResolverMap = (
  readModel: BDDReadModel,
  bindResolver: OmitFirstArgument<typeof query>
) =>
  Object.keys(readModel.resolvers).reduce<DeprecatedResolverMap>(
    (map, name) => {
      map[name] = (args: any) => {
        // eslint-disable-next-line no-console
        console.warn(
          `Direct resolver selector deprecated, you should use 'query' selector with arguments instead.`
        )
        return bindResolver(name, args)
      }
      return map
    },
    {}
  )

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
      throw Error(`Incomplete BDD test configuration! Please, provide a query.`)
    },
    ...makeDeprecatedResolverMap(readModel, partial(query, context)),
  }
}
