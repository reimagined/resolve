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

export const STOP_BATCH: symbol
export const OMIT_BATCH: symbol
