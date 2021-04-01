import partial from 'lodash.partial'
import {
  BDDReadModel,
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

// FIXME: deprecated
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

  // FIXME: deprecated
  if (readModel.adapter != null) {
    // eslint-disable-next-line no-console
    console.warn(
      `'adapter' property of read model deprecated, use 'withAdapter' selector instead.`
    )
    withAdapter(context, readModel.adapter)
  }

  // FIXME: deprecated
  if (readModel.encryption != null) {
    // eslint-disable-next-line no-console
    console.warn(
      `'encryption' property of read model deprecated, use 'withEncryption' selector instead.`
    )
    withEncryption(context, readModel.encryption)
  }

  return {
    query: partial(query, context),
    withAdapter: partial(withAdapter, context),
    withEncryption: partial(withEncryption, context),
    then: () => {
      throw Error(`Incomplete BDD test configuration! Please, provide a query.`)
    },
    ...makeDeprecatedResolverMap(readModel, partial(query, context)),
  }
}
