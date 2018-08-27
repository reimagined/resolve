import sinon from 'sinon'

let foundArray = []
let isRejectInsert = false

export const _setFindResult = array => {
  if (Array.isArray(array)) {
    foundArray = array
  } else {
    foundArray = []
  }
}

export const _setInsertCommandReject = isReject => {
  isRejectInsert = isReject
}

const db = {
  collection: sinon.spy(() => ({
    insert: sinon.spy(
      () =>
        !isRejectInsert ? Promise.resolve() : Promise.reject({ code: 11000 })
    ),
    find: sinon.spy(() => {
      const cursor = {
        sort: sinon.spy(() => cursor),
        stream: sinon.spy(() => ({
          on: (event, callback) => {
            if (event === 'data') {
              foundArray.forEach(elm => callback(elm))
            } else if (event === 'end') {
              callback()
            }
          }
        }))
      }

      return cursor
    }),
    createIndex: sinon.spy(() => Promise.resolve())
  }))
}

const client = {
  db: () => db
}

export const MongoClient = {
  connect: sinon.spy(() => Promise.resolve(client))
}
