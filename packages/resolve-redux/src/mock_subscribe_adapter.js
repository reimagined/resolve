const mockSubscribeAdapter = () => ({
  onEvent() {},
  onDisconnect() {},
  setSubscription() {},
  getClientId() {
    return Promise.resolve('0')
  }
})

export default mockSubscribeAdapter
