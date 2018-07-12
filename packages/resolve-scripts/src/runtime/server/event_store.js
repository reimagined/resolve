import createEventStore from 'resolve-es'

import storageAdapter from '$resolve.storageAdapter'
import busAdapter from '$resolve.busAdapter'

const createStorageAdapter = storageAdapter.module
const storageAdapterOptions = storageAdapter.options

const createBusAdapter = busAdapter.module
const busAdapterOptions = busAdapter.options

const storage = createStorageAdapter(storageAdapterOptions)

const bus = createBusAdapter(busAdapterOptions)

const eventStore = createEventStore({ storage, bus })

export default eventStore
