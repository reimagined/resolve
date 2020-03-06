const getSignedPut = async (adapter, dir) =>
  await adapter.createPresignedPut(dir)

const getSignedPost = async (adapter, dir) =>
  await adapter.createPresignedPost(dir)

const initUploader = async resolve => {
  if (typeof resolve.assemblies.uploadAdapter === 'function') {
    const adapter = resolve.assemblies.uploadAdapter()

    Object.assign(resolve, {
      uploader: {
        getSignedPut: getSignedPut.bind(null, adapter),
        getSignedPost: getSignedPost.bind(null, adapter),
        uploadPut: adapter.upload,
        uploadPost: adapter.uploadFormData,
        createToken: adapter.createToken,
        directory: adapter.directory,
        bucket: adapter.bucket,
        secretKey: adapter.secretKey
      }
    })
  }
}

export default initUploader
