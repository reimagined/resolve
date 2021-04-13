import partial from 'lodash.partial'
import { ReadModelContext } from '../../types'
import { query } from './query'
import { ReadModelNode } from './read-model'
import { EventHandlerEncryptionFactory } from '@resolve-js/core'

type WithEncryption = Omit<ReadModelNode, 'withEncryption'>

export const withEncryption = (
  context: ReadModelContext,
  encryption: EventHandlerEncryptionFactory
): WithEncryption => {
  if (context.encryption != null) {
    throw Error(`Read model encryption already assigned.`)
  }

  context.encryption = encryption

  return {
    query: partial(query, context),
  }
}
