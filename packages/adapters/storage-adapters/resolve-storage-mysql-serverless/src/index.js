import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import createAdapter from 'resolve-storage-base'

import connect from './connect'
import init from './init'
import loadEvents from './load-events'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import drop from './drop'
import dispose from './dispose'

const escapeId = str => `\`${String(str).replace(/([`])/gi, '$1$1')}\``
const escape = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`

export default createAdapter.bind(
  null,
  connect,
  init,
  loadEvents,
  getLatestEvent,
  saveEvent,
  drop,
  dispose,
  {
    RDSDataService,
    escapeId,
    escape
  }
)
