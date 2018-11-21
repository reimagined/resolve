const init = async ({ database, promiseInvoke }) => {
  await promiseInvoke(database.loadDatabase.bind(database))

  await promiseInvoke(database.ensureIndex.bind(database), {
    fieldName: 'aggregateIdAndVersion',
    unique: true,
    sparse: true
  })

  await promiseInvoke(database.ensureIndex.bind(database), {
    fieldName: 'aggregateId'
  })

  await promiseInvoke(database.ensureIndex.bind(database), {
    fieldName: 'aggregateVersion'
  })

  await promiseInvoke(database.ensureIndex.bind(database), {
    fieldName: 'type'
  })
}

export default init
