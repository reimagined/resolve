// mdis-start
const projection = {
  Init: async (store) => {
    await store.set(0)
  },
  INCREMENT: async (store, event) => {
    await store.set((await store.get()) + event.payload.count)
  },
  DECREMENT: async (store, event) => {
    await store.set((await store.get()) - event.payload.count)
  },
}

export default projection
// mdis-stop
