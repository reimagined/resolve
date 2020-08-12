function wrapMethod<
  Args extends Array<any>,
  Result extends any,
  AdapterConnection extends any,
  AdapterImplementation extends IAdapterImplementation<
    AdapterConnection,
    AdapterOptions
  >,
  Adapter extends IAdapter,
  AdapterOptions extends IAdapterOptions
>(
  state: AdapterState<AdapterConnection>,
  options: AdapterOptions,
  implementation: AdapterImplementation,
  method: (connection: AdapterConnection, ...args: Args) => Promise<Result>
): (...args: Args) => Promise<Result> {
  return async (...args: Args) => {
    throwWhenDisposed(state)
    await connectOnDemand(options, state, implementation)
    const connection = state.connection
    if (connection == null) {
      throw new Error('Bad connection')
    }
    return method(connection, ...args)
  }
}

export default wrapMethod
