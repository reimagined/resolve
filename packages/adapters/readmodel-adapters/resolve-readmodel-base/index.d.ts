declare type JsonPrimitive = string | number | boolean | null
declare type JsonMap = {
  [member: string]: JsonPrimitive | JsonArray | JsonMap
}
declare type JsonArray = Array<JsonPrimitive | JsonArray | JsonMap>
declare type JsonResult = {
  [member: string]: any
}
declare type SearchCondition =
  | {
      $and: Array<SearchCondition>
    }
  | {
      $or: Array<SearchCondition>
    }
  | {
      $not: SearchCondition
    }
  | {
      [member: string]: JsonPrimitive
    }
  | {
      [member: string]: {
        $eq: JsonPrimitive
      }
    }
  | {
      [member: string]: {
        $ne: JsonPrimitive
      }
    }
  | {
      [member: string]: {
        $lte: JsonPrimitive
      }
    }
  | {
      [member: string]: {
        $gte: JsonPrimitive
      }
    }
  | {
      [member: string]: {
        $lt: JsonPrimitive
      }
    }
  | {
      [member: string]: {
        $gt: JsonPrimitive
      }
    }
export declare type ResolveStore = {
  defineTable: (
    tableName: string,
    tableDeclaration: {
      indexes: {
        [member: string]: 'string' | 'number'
      }
      fields: Array<string>
    }
  ) => Promise<void>
  find: (
    tableName: string,
    searchCondition: SearchCondition,
    projectionCondition?: {
      [member: string]: 1 | 0
    },
    sortCondition?: {
      [member: string]: 1 | -1
    },
    skip?: number,
    limit?: number
  ) => Promise<Array<JsonResult>>
  findOne: (
    tableName: string,
    searchCondition: SearchCondition,
    projectionCondition?: {
      [member: string]: 1 | 0
    }
  ) => Promise<JsonResult | null>
  count: (
    tableName: string,
    searchCondition: SearchCondition
  ) => Promise<number>
  insert: (tableName: string, document: JsonMap) => Promise<void>
  update: (
    tableName: string,
    searchCondition: SearchCondition,
    updateCondition:
      | {
          $set: {
            [member: string]: JsonMap | JsonArray | JsonPrimitive
          }
        }
      | {
          $unset: {
            [member: string]: true
          }
        }
      | {
          $inc: {
            [member: string]: number | string
          }
        },
    updateOptions?: {
      upsert?: boolean
    }
  ) => Promise<void>
  delete: (tableName: string, searchCondition: SearchCondition) => Promise<void>
}

declare type PlainData = string | JsonMap
declare type EncryptedBlob = string
declare type Event = {
  type: string
  timestamp: number
  aggregateId: string
  payload: any
}
declare type ReadModelContext = {
  decrypt?: (blob: EncryptedBlob) => PlainData
}
declare type InitHandler = (store: ResolveStore) => Promise<void>
declare type EventHandler = (
  store: ResolveStore, 
  event: Event, 
  context: ReadModelContext
) => Promise<void>
export declare type ReadModel = {
  Init: InitHandler
  [key: string]: EventHandler
}

declare type Resolver = (store: ResolveStore, params: { [key: string]: any }) => Promise<any>
export declare type Resolvers = {
  [key: string]: Resolver
}
