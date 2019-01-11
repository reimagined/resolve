import MySQL from 'mysql2/promise'
import { escapeId } from 'mysql2'

export const createDatabase = async (connectionOptions, dbName) => {
  let connection = null
  try {
    connection = await MySQL.createConnection(connectionOptions)
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${escapeId(dbName)}`)
  } finally {
    if (connection != null) {
      await connection.end()
    }
  }
}

export const dropDatabase = async (connectionOptions, dbName) => {
  let connection = null
  try {
    connection = await MySQL.createConnection(connectionOptions)
    await connection.query(`DROP DATABASE IF EXISTS ${escapeId(dbName)}`)
  } finally {
    if (connection != null) {
      await connection.end()
    }
  }
}
