import createEventStore from 'resolve-es'

import { storageAdapter as storage, busAdapter as bus } from './assemblies'

const eventStore = createEventStore({ storage, bus })

export default eventStore
