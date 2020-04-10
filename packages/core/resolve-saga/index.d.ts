declare type SerializablePrimitive = string | number | boolean | null
declare type SerializableMap = {
  [key: string]: Serializable
}
declare type SerializableArray = Array<Serializable>
declare type Serializable = SerializablePrimitive | SerializableMap | SerializableArray

declare type PlainData = Serializable
declare type EncryptedBlob = Serializable
declare type Event = {
  type: string
  timestamp: number
  aggregateId: string
  payload: SerializableMap
}
declare type ReadModelContext = {
  decrypt?: (blob: EncryptedBlob) => PlainData
}
declare type InitHandler<TStore> = (store: TStore) => Promise<void>
declare type EventHandler<TStore> = (
  store: TStore,
  event: Event,
  context: ReadModelContext
) => Promise<void>
export declare type ReadModel<TStore> = {
  Init: InitHandler<TStore>
  [key: string]: EventHandler<TStore>
}

declare type Resolver<TStore> = (
  store: TStore,
  params: { [key: string]: any },
  jwt: string
) => Promise<any>
export declare type Resolvers<TStore> = {
  [key: string]: Resolver<TStore>
}
