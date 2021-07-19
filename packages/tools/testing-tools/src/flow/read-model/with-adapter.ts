import partial from 'lodash.partial'
import { ReadModelContext } from '../../types'
import { query } from './query'
import { withEncryption } from './with-encryption'
import { ReadModelNode } from './read-model'

type WithAdapterNode = Omit<ReadModelNode, 'withAdapter'>

export const withAdapter = (
  context: ReadModelContext,
  adapter: any
): WithAdapterNode => {
  if (context.adapter != null) {
    throw Error(`Read model adapter already assigned.`)
  }

  context.adapter = adapter

  return {
    query: partial(query, context),
    withEncryption: partial(withEncryption, context),
  }
}
