export const LONG_STRING_SQL_TYPE = 'VARCHAR(190)'
export const LONG_NUMBER_SQL_TYPE = 'BIGINT'
export const JSON_SQL_TYPE = 'jsonb'

export const RESERVED_EVENT_SIZE = 66 // 3 reserved BIGINT fields with commas
export const BUFFER_SIZE = 512 * 1024
export const BATCH_SIZE = 100

export const PARTIAL_EVENT_FLAG = Symbol()
export const DATA_API_ERROR_FLAG = Symbol()
