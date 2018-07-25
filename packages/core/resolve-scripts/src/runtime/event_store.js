import createEventStore from 'resolve-es'

import { storageAdapter, busAdapter } from './assemblies'

const createStorageAdapter = storageAdapter.module
const storageAdapterOptions = storageAdapter.options

const createBusAdapter = busAdapter.module
const busAdapterOptions = busAdapter.options

const storage = createStorageAdapter(storageAdapterOptions)

const bus = createBusAdapter(busAdapterOptions)

const eventStore = createEventStore({ storage, bus })

export default eventStore
