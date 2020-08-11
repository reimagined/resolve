async function connectOnDemand<
  AdapterConnection extends any,
  AdapterImplementation extends IAdapterImplementation<
    AdapterConnection,
    AdapterOptions
    >,
  AdapterOptions extends IAdapterOptions
  >(
  options: AdapterOptions,
  state: AdapterState<AdapterConnection>,
  implementation: AdapterImplementation
): Promise<void> {
  throwWhenDisposed(state);
  if (state.status === Status.NOT_CONNECTED) {
    state.connection = await implementation.connect(options);
    state.status = Status.CONNECTED;
  }
}
