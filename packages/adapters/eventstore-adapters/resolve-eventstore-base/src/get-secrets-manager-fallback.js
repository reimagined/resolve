export default () => ({
  getSecret: () =>
    Promise.reject(
      'configured event store adapter does not support secrets management'
    ),
  setSecret: () =>
    Promise.reject(
      'configured event store adapter does not support secrets management'
    ),
  deleteSecret: () =>
    Promise.reject(
      'configured event store adapter does not support secrets management'
    ),
});
