const encodeXpubTopic = ({ listenerId, clientId }) => {
  const encodedListenerId = Buffer.from(listenerId).toString('base64')
  const encodedClientId = Buffer.from(clientId).toString('base64')
  const encodedTopic = `${encodedListenerId}-${encodedClientId}`
  return encodedTopic
}

export default encodeXpubTopic
