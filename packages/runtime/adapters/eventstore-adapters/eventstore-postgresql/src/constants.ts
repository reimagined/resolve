export const LONG_STRING_SQL_TYPE = 'VARCHAR(190)'
export const LONG_NUMBER_SQL_TYPE = 'BIGINT'
export const INT8_SQL_TYPE = 'INT8'
export const JSON_SQL_TYPE = 'JSONB'
export const TEXT_SQL_TYPE = 'TEXT'
export const BIG_SERIAL = 'BIGSERIAL'

export const RESERVED_EVENT_SIZE = 66 // 3 reserved BIGINT fields with commas
export const BUFFER_SIZE = 512 * 1024
export const BATCH_SIZE = 100

export const PARTIAL_EVENT_FLAG = Symbol()
export const DATA_API_ERROR_FLAG = Symbol()
export const RESPONSE_SIZE_LIMIT = Symbol()

export const AGGREGATE_ID_SQL_TYPE = LONG_STRING_SQL_TYPE

export const DEFAULT_QUERY_TIMEOUT = 45000
export const MINIMAL_QUERY_TIMEOUT = 1000

export const MAX_RECONNECTIONS = 5
export const SERVICE_WAIT_TIME = 1000
