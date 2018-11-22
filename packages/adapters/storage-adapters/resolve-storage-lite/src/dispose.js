const dispose = async ({ database, promiseInvoke }, { dropEvents }) => {
  if (dropEvents) {
    await promiseInvoke(database.remove.bind(database), {}, { multi: true })
    await database.resetIndexes()
  }
}

export default dispose
