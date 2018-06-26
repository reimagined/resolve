const getMqttTopics = (appId, { topicName, topicId }) =>
  `${appId}/${topicName}/${topicId}`

export default getMqttTopics
