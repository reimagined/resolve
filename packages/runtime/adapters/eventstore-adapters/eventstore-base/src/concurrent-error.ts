export default class ConcurrentError extends Error {
  constructor(aggregateId: string) {
    super(
      `Cannot save the event because the aggregate '${aggregateId}' is currently out of date. Please retry later.`
    )

    this.name = 'ConcurrentError'
    Object.setPrototypeOf(this, new.target.prototype)
  }

  static is(err: any): boolean {
    return err instanceof Error && err.name === 'ConcurrentError'
  }
}
