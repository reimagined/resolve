const emptyAsyncFunction = Promise.resolve.bind(Promise, null)

const emptySnapshotAdapter = () =>
  Object.freeze({
    loadSnapshot: emptyAsyncFunction,
    saveSnapshot: emptyAsyncFunction,
    dispose: emptyAsyncFunction,
    dropSnapshot: emptyAsyncFunction,
    init: emptyAsyncFunction,
    drop: emptyAsyncFunction,
  })

export default emptySnapshotAdapter
