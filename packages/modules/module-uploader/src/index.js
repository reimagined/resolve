const createModule = (options) => {
  const apiHandlerOptions = options
  const aggregateOptions = {}
  const runtimeEnvSymbol = Symbol('@@resolve/runtime_env')

  for (let key of Object.keys(options)) {
    if (
      options[key].type &&
      options[key].type.toString() === runtimeEnvSymbol.toString()
    ) {
      continue
    }
    Object.assign(aggregateOptions, {
      [key]: options[key],
    })
  }

  return {
    apiHandlers: [
      {
        path: '/api/uploader/getFormUpload',
        handler: {
          module:
            '@resolve-js/module-uploader/lib/api-handlers/getFormUpload.js',
          options: apiHandlerOptions,
        },
        method: 'GET',
      },
      {
        path: '/api/uploader/getUploadUrl',
        handler: {
          module:
            '@resolve-js/module-uploader/lib/api-handlers/getUploadUrl.js',
          options: apiHandlerOptions,
        },
        method: 'GET',
      },
      {
        path: '/api/uploader/getToken',
        handler: {
          module: '@resolve-js/module-uploader/lib/api-handlers/getToken.js',
          options: apiHandlerOptions,
        },
        method: 'GET',
      },
    ],
  }
}

export const getCDNBasedUrl = ({ CDNUrl, dir, uploadId, token }) => {
  return `${CDNUrl}/${dir}/${uploadId}?token=${token}`
}

export const getFormUpload = ({ dir }) => {
  return fetch(`/api/uploader/getFormUpload?dir=${dir}`, {
    mode: 'no-cors',
  }).then((response) => response.json())
}

export const getUploadUrl = ({ dir }) => {
  return fetch(`/api/uploader/getUploadUrl?dir=${dir}`, {
    mode: 'no-cors',
  }).then((response) => response.json())
}

export const getToken = ({ dir }) => {
  return fetch(`/api/uploader/getToken?dir=${dir}`, {
    mode: 'no-cors',
  }).then((response) => response.text())
}

export default createModule
