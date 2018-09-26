import NeDB from 'nedb'
import createAdapter from 'resolve-readmodel-base'

import metaApi from './meta-api'
import storeApi from './store-api'

export default createAdapter.bind(null, {
  metaApi: {
    ...metaApi,
    connect: metaApi.connect.bind(null, NeDB)
  },
  storeApi
})
