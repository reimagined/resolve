const encodeXpubTopic = ({ listenerId, clientId }) => {
  const encodedListenerId = new Buffer(listenerId).toString('base64')
  const encodedClientId = new Buffer(clientId).toString('base64')
  const encodedTopic = `${encodedListenerId}-${encodedClientId}`
  return encodedTopic
}

export default encodeXpubTopic
