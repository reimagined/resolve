import { temporaryErrors } from './constants'

const executeSingleQuery = async (documentClient, query) => {
  while (true) {
    try {
      return await documentClient.query(query).promise()
    } catch (error) {
      if (!temporaryErrors.includes(error.code)) {
        throw error
      }
    }
  }
}

export default executeSingleQuery
