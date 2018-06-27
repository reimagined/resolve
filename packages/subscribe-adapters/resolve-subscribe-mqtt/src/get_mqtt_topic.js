const getMqttTopic = (appId, { topicName, topicId }) =>
  `${appId}/${topicName}/${topicId}`

export default getMqttTopic
