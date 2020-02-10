/*eslint-disable no-console*/

const path = require('path')
const fs = require('fs')
const request = require('request')
const util = require('util')
const mime = require('mime-types')

const directoryPath = path.join(__dirname, 'files')
const readDir = util.promisify(fs.readdir)
const readFile = util.promisify(fs.readFile)

const sendCommand = async (
  pool,
  { aggregateName, aggregateId, type, payload }
) => {
  return new Promise((resolve, reject) => {
    request.post(
      {
        uri: `${pool.applicationOrigin}/api/commands`,
        headers: {
          authorization: `Bearer ${pool.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aggregateName,
          aggregateId,
          type,
          payload
        })
      },
      (error, _, body) => {
        if (error) {
          reject(error)
          return
        }
        resolve(body)
      }
    )
  })
}

const getUploadUrl = async pool => {
  const { login, projectId, jwtToken, applicationOrigin } = pool
  return new Promise((resolve, reject) => {
    request.get(
      {
        uri: `${applicationOrigin}/api/uploader/getUploadUrl?dir=${login}/${projectId}`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      },
      (error, _, body) => {
        if (error) {
          reject(error)
          return
        }
        resolve(JSON.parse(body))
      }
    )
  })
}

const getJwtToken = pool => {
  const { login, password } = pool
  return new Promise((resolve, reject) => {
    request.get(
      {
        uri: `${pool.applicationOrigin}/api/query/Users/getJwtToken?login=${login}&password=${password}`
      },
      (error, _, body) => {
        if (error) {
          reject(error)
          return
        }
        resolve(body)
      }
    )
  })
}

const uploadFile = async (pool, filePath) => {
  const { projectId, login } = pool
  const { uploadUrl, uploadId } = await getUploadUrl(pool)
  const contentType = mime.contentType(path.extname(filePath)) || 'text/plain; charset=utf-8'

  await sendCommand(pool, {
    type: 'fileNotLoaded',
    aggregateId: uploadId,
    aggregateName: 'File',
    payload: { userId: login, projectId }
  })
  console.log(`File: ${uploadId} - not loaded`)

  const file = await readFile(filePath)
  const fileSizeInBytes = file.length
  try {
    await sendCommand(pool, {
      type: 'startLoadingFile',
      aggregateId: uploadId,
      aggregateName: 'File'
    })
    console.log(`File: ${uploadId} - loading start`)

    await new Promise((resolve, reject) => {
      request.put(
        {
          uri: uploadUrl,
          headers: {
            'Content-Length': fileSizeInBytes,
            'Content-Type': contentType
          },
          body: file
        },
        (error, _, body) => {
          error ? reject(error) : body ? reject(body) : resolve()
        }
      )
    })
  } catch (error) {
    await sendCommand(pool, {
      type: 'failureLoadingFile',
      aggregateId: uploadId,
      aggregateName: 'File'
    })
    console.log(`File: ${uploadId} - loading failure`)
    console.log(`Error: ${error}`)
    return
  }
  await sendCommand(pool, {
    type: 'successLoadingFile',
    aggregateId: uploadId,
    aggregateName: 'File'
  })
  console.log(`File: ${uploadId} - loading success`)
}

const main = async () => {
  if (
    !process.env.hasOwnProperty('APPLICATION_ORIGIN') ||
    !process.env.hasOwnProperty('PROJECT_ID') ||
    !process.env.hasOwnProperty('LOGIN') ||
    !process.env.hasOwnProperty('PASSWORD')
  ) {
    throw new Error(
      'Environment variables APPLICATION_ORIGIN or PROJECT_ID or LOGIN or PASSWORD not defined'
    )
  }

  const pool = {
    applicationOrigin: process.env.APPLICATION_ORIGIN,
    projectId: process.env.PROJECT_ID,
    login: process.env.LOGIN,
    password: process.env.PASSWORD
  }

  pool.jwtToken = JSON.parse(await getJwtToken(pool))

  const files = await readDir(directoryPath)

  for (let fileName of files) {
    await uploadFile(pool, path.join(directoryPath, fileName))
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})

/*eslint-enable no-console*/
