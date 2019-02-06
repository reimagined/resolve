const readAndSerialize = async (readModel, readArgs) => {
  return JSON.stringify(await readModel.read(readArgs), null, 2)
}

export default readAndSerialize
