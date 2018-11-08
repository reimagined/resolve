const dispose = async ({ database, promiseInvoke }, { dropEvents }) => {
  if (dropEvents) {
    await promiseInvoke(database.remove.bind(database), {}, { multi: true })
    await database.clearIndexes()
  }
}

export default dispose
