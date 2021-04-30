export const ReplicationAlreadyInProgress: {
  new (message?: string): Error
  is: (error: any) => boolean
} = function (this: Error, message?: string): void {
  Error.call(this)
  this.message = message ?? 'Replication is already in progress'
  this.name = 'ReplicationAlreadyInProgress'
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ReplicationAlreadyInProgress)
  } else {
    this.stack = new Error().stack
  }
} as any

void ((ReplicationAlreadyInProgress as any).is = (error: any): boolean =>
  error != null && error.name === 'ReplicationAlreadyInProgress')

ReplicationAlreadyInProgress.prototype = Object.create(Error.prototype, {
  constructor: { enumerable: true, value: ReplicationAlreadyInProgress },
})
