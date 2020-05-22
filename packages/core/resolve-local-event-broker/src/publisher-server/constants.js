export const NOTIFICATIONS_TABLE_NAME = 'notifications'
export const SUBSCRIBERS_TABLE_NAME = 'subscribers'
export const BATCHES_TABLE_NAME = 'batches'

export const INTEGER_SQL_TYPE = 'INTEGER'
export const LONG_INTEGER_SQL_TYPE = 'BIGINT'
export const STRING_SQL_TYPE = 'VARCHAR(700)'
export const JSON_SQL_TYPE = 'JSON'

export const BATCH_CONSUMING_TIME = 240000

export const TRANSFORM_JSON_REGULAR_SYMBOL = Symbol('TRANSFORM_JSON_REGULAR')
export const TRANSFORM_JSON_MAPPED_ARRAY_SYMBOL = Symbol(
  'TRANSFORM_JSON_MAPPED_ARRAY'
)
export const TRANSFORM_NONE_SYMBOL = Symbol('TRANSFORM_NONE')

export const SQLITE_BUSY = 'SQLITE_BUSY'

export const LazinessStrategy = (function(LazinessStrategy) {
  LazinessStrategy['EAGER'] = 'eager'
  LazinessStrategy['LAZY'] = 'lazy'
  return Object.freeze(LazinessStrategy)
})({})

export const DeliveryStrategy = (function(DeliveryStrategy) {
  DeliveryStrategy['ACTIVE_NONE'] = 'active-none-transaction'
  DeliveryStrategy['ACTIVE_REGULAR'] = 'active-regular-transaction'
  DeliveryStrategy['ACTIVE_XA'] = 'active-xa-transaction'
  DeliveryStrategy['PASSIVE'] = 'passive'
  return Object.freeze(DeliveryStrategy)
})({})

export const QueueStrategy = (function(QueueStrategy) {
  QueueStrategy['GLOBAL'] = 'global'
  QueueStrategy['EVENT_TYPES'] = 'event-types'
  QueueStrategy['AGGREGATE_IDS'] = 'aggregate-ids'
  QueueStrategy['NONE'] = 'none'
  return Object.freeze(QueueStrategy)
})({})

export const SubscriptionStatus = (function(SubscriptionStatus) {
  SubscriptionStatus['DELIVER'] = 'deliver'
  SubscriptionStatus['SKIP'] = 'skip'
  SubscriptionStatus['ERROR'] = 'error'
  return Object.freeze(SubscriptionStatus)
})({})

export const NotificationStatus = (function(NotificationStatus) {
  NotificationStatus['RECIEVED'] = 'received-notification'
  NotificationStatus['PROCESSING'] = 'processing-notification'
  NotificationStatus['ACKNOWLEDGE_ENTERING'] =
    'acknowledge-entering-notification'
  NotificationStatus['ACKNOWLEDGE_XA_COMMITING'] =
    'acknowledge-xa-commiting-notification'
  NotificationStatus['ACKNOWLEDGE_XA_ROLLBACKING'] =
    'acknowledge-xa-rollbacking-notification'
  NotificationStatus['TIMEOUT_ENTERING'] = 'timeout-entering-notification'
  NotificationStatus['TIMEOUT_XA_COMMITING'] =
    'timeout-xa-commiting-notification'
  NotificationStatus['TIMEOUT_XA_ROLLBACKING'] =
    'timeout-xa-rollbacking-notification'
  return Object.freeze(NotificationStatus)
})({})

export const SERIALIZED_ERROR_SYMBOL = Symbol('SERIALIZED_ERROR')

export const PublicOperationType = (function(PublicOperationType) {
  PublicOperationType['PUBLISH'] = 'publish'
  PublicOperationType['SUBSCRIBE'] = 'subscribe'
  PublicOperationType['RESUBSCRIBE'] = 'resubscribe'
  PublicOperationType['UNSUBSCRIBE'] = 'unsubscribe'
  PublicOperationType['ACKNOWLEDGE'] = 'acknowledge'
  PublicOperationType['STATUS'] = 'status'
  PublicOperationType['RESUME'] = 'resume'
  PublicOperationType['PAUSE'] = 'pause'
  PublicOperationType['RESET'] = 'reset'
  PublicOperationType['READ'] = 'read'
  return Object.freeze(PublicOperationType)
})({})

export const PrivateOperationType = (function(PrivateOperationType) {
  PrivateOperationType['PUSH_NOTIFICATIONS'] = 'push-notifications'
  PrivateOperationType['PULL_NOTIFICATIONS'] = 'pull-notifications'
  PrivateOperationType['RESUME_SUBSCRIBER'] = 'resume-subscriber'
  PrivateOperationType['ACKNOWLEDGE_BATCH'] = 'acknowledge-batch'
  PrivateOperationType['FINALIZE_BATCH'] = 'finalize-batch'
  PrivateOperationType['REQUEST_TIMEOUT'] = 'request-timeout'
  PrivateOperationType['DELIVER_BATCH'] = 'deliver-batch'
  return Object.freeze(PrivateOperationType)
})({})

export const ConsumerMethod = (function(ConsumerMethod) {
  ConsumerMethod['SaveEvent'] = 'SaveEvent'
  ConsumerMethod['LoadEvents'] = 'LoadEvents'
  ConsumerMethod['SendEvents'] = 'SendEvents'
  ConsumerMethod['BeginXATransaction'] = 'BeginXATransaction'
  ConsumerMethod['CommitXATransaction'] = 'CommitXATransaction'
  ConsumerMethod['RollbackXATransaction'] = 'RollbackXATransaction'
  ConsumerMethod['Drop'] = 'Drop'
  return Object.freeze(ConsumerMethod)
})({})
