const getMqttTopic = (appId, { topicName, topicId }) => {
  console.log(
    `${appId}/${topicName === '*' ? '#' : topicName}/${
      topicId === '*' ? '#' : topicId
    }`
  )

  return `${appId}/${topicName === '*' ? '#' : topicName}/${
    topicId === '*' ? '#' : topicId
  }`
}

export default getMqttTopic
