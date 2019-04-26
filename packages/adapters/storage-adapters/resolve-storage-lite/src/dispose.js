const dispose = async ({ database }) => {
  await database.close()
}

export default dispose
