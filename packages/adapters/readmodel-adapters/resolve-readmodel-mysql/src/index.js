import mysql from 'mysql2/promise'
import { escapeId, escape } from 'mysql2'
import createAdapter from 'resolve-readmodel-base'

import metaApi from './meta-api'
import storeApi from './store-api'

export default createAdapter.bind(null, {
  metaApi: {
    ...metaApi,
    connect: metaApi.connect.bind(null, { mysql, escapeId, escape })
  },
  storeApi
})
