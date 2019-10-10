const processProperties = async (pool, content) => {
  const { messageGuid, result } = JSON.parse(content)
  const resolver = pool.propertiesTopicsPromises.get(messageGuid)
  resolver(result)
}

export default processProperties
