import createQuery from 'resolve-query'
import createStorageAdapter from 'resolve-storage-lite'
import createBusAdapter from 'resolve-bus-memory'
import createEventStore from 'resolve-es'
import createReadModelAdapter from 'resolve-readmodel-memory'

import createReadModelFactory from './create-read-model'
import applyEvent from './apply-event'
import applyEvents from './apply-events'
import createResolver from './create-resolver'
import createResolvers from './create-resolvers'

export const createReadModel = createReadModelFactory.bind(null, {
  createQuery,
  createStorageAdapter,
  createBusAdapter,
  createEventStore,
  createReadModelAdapter,
  createResolver,
  createResolvers,
  applyEvent,
  applyEvents
})
