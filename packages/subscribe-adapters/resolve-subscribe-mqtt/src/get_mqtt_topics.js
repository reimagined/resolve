const getMqttTopics = (appId, topics) => topics.map(
  ({ topicName, topicId }) =>
    `${appId}/${topicName}/${topicId}`
)

export default getMqttTopics
