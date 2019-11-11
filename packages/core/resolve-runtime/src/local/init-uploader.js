const getSignedPut = async (adapter, { dir, uploadId }) =>
  await adapter.createPresignedPut(dir, uploadId)

const getSignedPost = async (adapter, { dir, uploadId }) =>
  await adapter.createPresignedPost(dir, uploadId)

const initUploader = async resolve => {
  if (typeof resolve.assemblies.uploadAdapter === 'function') {
    const adapter = resolve.assemblies.uploadAdapter()

    Object.assign(resolve, {
      uploader: {
        getSignedPut: getSignedPut.bind(null, adapter),
        getSignedPost: getSignedPost.bind(null, adapter),
        uploadPut: adapter.upload,
        uploadPost: adapter.uploadFormData
      }
    })
  }
}

export default initUploader
