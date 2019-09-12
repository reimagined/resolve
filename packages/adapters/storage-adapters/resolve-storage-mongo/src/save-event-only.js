const saveEventOnly = async function({ collection }, event) {
  await collection.insertOne(event)
}

export default saveEventOnly
