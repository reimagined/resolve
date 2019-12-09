import jsonwebtoken from 'jsonwebtoken'

import { URL_CREATED } from '../event-types'

const createUploaderCommands = ({ jwtSecret }) => ({
  createSignedUrl: (state, command, jwtToken) => {
    const { uploadId } = command.payload
    const jwt = jsonwebtoken.verify(jwtToken, jwtSecret)

    if (jwt !== uploadId) {
      throw new Error('JWT not valid')
    }

    return {
      type: URL_CREATED,
      payload: {
        uploadId: uploadId
      }
    }
  }
})

export default createUploaderCommands
