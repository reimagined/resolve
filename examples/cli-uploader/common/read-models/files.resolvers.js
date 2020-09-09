const getFiles = async (store) => {
  const files = await store.find('Files', {})
  return Array.isArray(files) ? files : []
}

const getFile = async (store, { uploadId }) => {
  const file = await store.findOne('Files', { id: uploadId })

  if (!file) {
    return null
  }

  return file
}

export default {
  allFiles: getFiles,
  file: getFile,
}
