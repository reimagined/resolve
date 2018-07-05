const getMqttTopic = (appId, { topicName, topicId }) => {
  return `${appId}/${topicName === '*' ? '+' : topicName}/${
    topicId === '*' ? '+' : topicId
  }`
}

export default getMqttTopic
