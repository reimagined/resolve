const isSagaName = (resolve, name) => resolve.sagaNames.has(name)

export default isSagaName
