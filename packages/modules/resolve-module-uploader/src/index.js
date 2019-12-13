const createModule = options => {
  const apiHandlerOptions = options
  const aggregateOptions = {}
  const runtimeEnvSymbol = Symbol('@@resolve/runtime_env')

  for (let key of Object.keys(options)) {
    if (options[key].type && options[key].type.toString() === runtimeEnvSymbol.toString()) {
      continue
    }
    Object.assign(aggregateOptions, {
      [key]: options[key]
    })
  }

  return {
    apiHandlers: [
      {
        path: '/api/uploader/getFormUpload',
        controller: {
          module: 'resolve-module-uploader/lib/api-handlers/getFormUpload.js',
          options: apiHandlerOptions
        },
        method: 'GET'
      },
      {
        path: '/api/uploader/getToken',
        controller: {
          module: 'resolve-module-uploader/lib/api-handlers/getToken.js',
          options: apiHandlerOptions
        },
        method: 'GET'
      }
    ],
    aggregates: [
      {
        name: 'Uploader',
        commands: {
          module: 'resolve-module-uploader/lib/aggregates/uploader.commands.js',
          options: aggregateOptions
        }
      }
    ]
  }
}

export const getCDNBasedUrl = ({ CDNUrl, dir, uploadId, token }) => {
  return `${CDNUrl}/${dir}/${uploadId}?token=${token}`
}

export const getFormUpload = ({ dir }) => {
  return fetch(`/api/uploader/getFormUpload?dir=${dir}`, {
    mode: 'no-cors'
  }).then(response => response.json())
}

export const getToken = ({ dir }) => {
  return fetch(`/api/uploader/getToken?dir=${dir}`, {
    mode: 'no-cors'
  }).then(response => response.text())
}

export default createModule
