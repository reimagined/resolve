const store = new Map()

const snapshotAdapter = Object.freeze({
  loadSnapshot: async key => store.get(key),
  saveSnapshot: (key, value) => store.set(key, value)
})

export default snapshotAdapter
