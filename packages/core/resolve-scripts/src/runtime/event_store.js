import createEventStore from 'resolve-es'

import {
  storageAdapter as createStorageAdapter,
  busAdapter as createBusAdapter
} from './assemblies'

const storage = createStorageAdapter()
const bus = createBusAdapter()

const eventStore = createEventStore({ storage, bus })

export default eventStore
