const getSignedPut = async (adapter, { dir, uploadId }) =>
  await adapter.createPresignedPut(dir, uploadId)

const getSignedPost = async (adapter, { dir, uploadId }) =>
  await adapter.createPresignedPost(dir, uploadId)

const getToken = async (adapter, { dir, expireTime }) =>
  adapter.createToken({
    deploymentId: adapter.deploymentId,
    dir,
    expireTime
  })

const getCDNUrl = async ({ CDN }) => CDN

const initUploader = async resolve => {
  if (typeof resolve.assemblies.uploadAdapter === 'function') {
    const adapter = resolve.assemblies.uploadAdapter({
      accessKeyId: 'S3RVER',
      secretAccessKey: 'S3RVER',
      endpoint: `http://localhost:3001`,
      bucket: 'files',
      sslEnabled: false,
      s3ForcePathStyle: true
    })

    Object.assign(resolve, {
      uploader: {
        getSignedPut: getSignedPut.bind(null, adapter),
        getSignedPost: getSignedPost.bind(null, adapter),
        getToken: getToken.bind(null, adapter),
        getCDNUrl: getCDNUrl.bind(null, adapter),
        uploadPut: adapter.upload,
        uploadPost: adapter.uploadFormData
      }
    })
  }
}

export default initUploader
