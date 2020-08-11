function wrapDispose<
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
  dispose: (connection: AdapterConnection, ...args: Args) => Promise<void>
): (...args: Args) => Promise<void> {
  return async (...args: Args) => {
    throwWhenDisposed(state);
    state.status = Status.DISPOSED;
    const connection = state.connection;
    if (connection == null) {
      return;
    }
    await dispose(connection, ...args);
  };
}

export default wrapDispose
