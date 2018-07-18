import mysql from 'mysql2/promise'
import { escapeId } from 'mysql2'
import createAdapter from 'resolve-readmodel-base'

import implementation from './implementation'
import metaApi from './meta-api'
import storeApi from './store-api'

export default createAdapter.bind(
  null,
  implementation.bind(null, metaApi, storeApi, mysql, escapeId)
)
