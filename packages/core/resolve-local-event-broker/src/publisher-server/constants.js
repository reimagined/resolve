export const NOTIFICATIONS_TABLE_NAME = 'notifications'
export const SUBSCRIBERS_TABLE_NAME = 'subscribers'
export const BATCHES_TABLE_NAME = 'batches'

export const INTEGER_SQL_TYPE = 'INTEGER'
export const LONG_INTEGER_SQL_TYPE = 'BIGINT'
export const STRING_SQL_TYPE = 'VARCHAR(700)'
export const JSON_SQL_TYPE = 'JSON'

export const DELIVERY_STRATEGY_ACTIVE_NONE = 'active-none-transaction'
export const DELIVERY_STRATEGY_ACTIVE_REGULAR = 'active-regular-transaction'
export const DELIVERY_STRATEGY_ACTIVE_XA = 'active-xa-transaction'
export const DELIVERY_STRATEGY_PASSIVE = 'passive'

export const QUEUE_STRATEGY_GLOBAL = 'global'
export const QUEUE_STRATEGY_EVENT_TYPES = 'event-types'
export const QUEUE_STRATEGY_AGGREGATE_IDS = 'aggregate-ids'
export const QUEUE_STRATEGY_NONE = 'none'

export const STATUS_DELIVER = 'deliver'
export const STATUS_SKIP = 'skip'
export const STATUS_ERROR = 'error'

export const STATUS_ACCEPTED_NOTIFICATION = 'accepted-notification'
export const STATUS_PROCESSING_NOTIFICATION = 'processing-notification'
export const STATUS_XA_PREPARE_NOTIFICATION = 'xa-prepare-notification'

export const BATCH_CONSUMING_TIME = 240000

export const TIMEOUT_SYMBOL = Symbol('TIMEOUT_SYMBOL')
export const INTERLOCK_SYMBOL = Symbol('INTERLOCK_SYMBOL')
export const SERIALIZED_ERROR_SYMBOL = Symbol('SERIALIZED_ERROR')

export const SUBSCRIBER_OPTIONS_FETCH_SYMBOL = Symbol(
  'SUBSCRIBER_OPTIONS_FETCH'
)
export const SUBSCRIBER_OPTIONS_PARSE_SYMBOL = Symbol(
  'SUBSCRIBER_OPTIONS_PARSE'
)

export const TRANSFORM_JSON_REGULAR_SYMBOL = Symbol('TRANSFORM_JSON_REGULAR')
export const TRANSFORM_JSON_MAPPED_ARRAY_SYMBOL = Symbol(
  'TRANSFORM_JSON_MAPPED_ARRAY'
)
export const TRANSFORM_NONE_SYMBOL = Symbol('TRANSFORM_NONE')

export const SUBSCRIBE_SYMBOL = Symbol('SUBSCRIBE')
export const RESUBSCRIBE_SYMBOL = Symbol('RESUBSCRIBE')
export const UNSUBSCRIBE_SYMBOL = Symbol('UNSUBSCRIBE')

export const NOTIFICATION_EVENT_SYMBOL = Symbol('EVENT')
export const NOTIFICATION_UPDATE_SYMBOL = Symbol('UPDATE')

export const RESUME_SYMBOL = Symbol('RESUME')
export const PAUSE_SYMBOL = Symbol('PAUSE')

export const SQLITE_BUSY = 'SQLITE_BUSY'
