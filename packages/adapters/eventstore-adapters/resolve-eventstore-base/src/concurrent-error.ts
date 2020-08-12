class ConcurrentError extends Error {
  constructor(aggregateId: string) {
    super(
      `Can not save the event because aggregate '${aggregateId}' is not actual at the moment. Please retry later.`
    )
    this.name = 'ConcurrentError'
  }
}

export default ConcurrentError
