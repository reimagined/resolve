export type ReadModelBaseAdapter = {
  connect: () => Promise<void>,
  disconnect: () => Promise<void>,
  dispose: () => Promise<void>,
}

export type ReadModelBaseAdapterWithInlineLedger = ReadModelBaseAdapter & {
  subscribe: () => Promise<void>,
  unsubscribe: () => Promise<void>,
  resubscribe: () => Promise<void>,
  deleteProperty: () => Promise<void>,
  getProperty: () => Promise<void>,
  listProperties: () => Promise<void>,
  setProperty: () => Promise<void>,
  resume: () => Promise<void>,
  pause: () => Promise<void>,
  reset: () => Promise<void>,
  status: () => Promise<void>,
  build: () => Promise<void>,
}

export type ReadModelBaseAdapterWithoutInlineLedger = ReadModelBaseAdapter & {
  drop: () => Promise<void>,
  dropReadModel: () => Promise<void>,
  beginTransaction: () => Promise<void>,
  commitTransaction: () => Promise<void>,
  rollbackTransaction: () => Promise<void>,
  beginXATransaction: () => Promise<void>,
  commitXATransaction: () => Promise<void>,
  rollbackXATransaction: () => Promise<void>,
  beginEvent: () => Promise<void>,
  commitEvent: () => Promise<void>,
  rollbackEvent: () => Promise<void>,
}

export type ReadModelImplementation = {
  connect: () => Promise<void>,
  disconnect: () => Promise<void>,
  dropReadModel: () => Promise<void>,
  beginTransaction: () => Promise<void>,
  commitTransaction: () => Promise<void>,
  rollbackTransaction: () => Promise<void>,
  beginXATransaction: () => Promise<void>,
  commitXATransaction: () => Promise<void>,
  rollbackXATransaction: () => Promise<void>,
  beginEvent: () => Promise<void>,
  commitEvent: () => Promise<void>,
  rollbackEvent: () => Promise<void>,
  subscribe: () => Promise<void>,
  unsubscribe: () => Promise<void>,
  resubscribe: () => Promise<void>,
  deleteProperty: () => Promise<void>,
  getProperty: () => Promise<void>,
  listProperties: () => Promise<void>,
  setProperty: () => Promise<void>,
  resume: () => Promise<void>,
  pause: () => Promise<void>,
  reset: () => Promise<void>,
  status: () => Promise<void>,
  build: () => Promise<void>,
}

export type Store = {
  defineTable: Function
  find: Function
  findOne: Function
  count: Function
  insert: Function
  update: Function
  delete: Function
}

export type Projection = {
  Init?: ()=>Promise<void>
} & Record<string, ()=>Promise<void>>
