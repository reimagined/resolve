const getSignedPut = async (adapter, dir) =>
  await adapter.createPresignedPut(dir);

const getSignedPost = async (adapter, dir) =>
  await adapter.createPresignedPost(dir);

const getCDNUrl = async ({ CDN }) => CDN;

const initUploader = async (resolve) => {
  if (typeof resolve.assemblies.uploadAdapter === 'function') {
    const adapter = resolve.assemblies.uploadAdapter();

    Object.assign(resolve, {
      uploader: {
        getSignedPut: getSignedPut.bind(null, adapter),
        getSignedPost: getSignedPost.bind(null, adapter),
        getCDNUrl: getCDNUrl.bind(null, adapter),
        createToken: adapter.createToken,
        uploadPut: adapter.upload,
        uploadPost: adapter.uploadFormData,
      },
    });
  }
};

export default initUploader;
