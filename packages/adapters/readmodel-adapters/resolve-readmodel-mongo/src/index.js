import { MongoClient } from 'mongodb'
import createAdapter from 'resolve-readmodel-base'

import implementation from './implementation'
import metaApi from './meta-api'
import storeApi from './store-api'

export default createAdapter.bind(
  null,
  implementation.bind(null, metaApi, storeApi, MongoClient)
)
