const processInformation = async (pool, content) => {
  const { messageGuid, ...information } = JSON.parse(content)
  const resolver = pool.informationTopicsPromises.get(messageGuid)
  resolver(information)
}

export default processInformation
