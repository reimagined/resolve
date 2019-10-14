import cuid from 'cuid'
import zmq from 'resolve-zeromq'

import connectLocalBusBroker from './connect-local-bus-broker'
import declareListenerEventTypes from './declare-listener-event-types'
import processIncomingMessages from './process-incoming-messages'
import requestListenerReset from './request-listener-reset'
import requestListenerInformation from './request-listener-information'
import requestListenerPause from './request-listener-pause'
import requestListenerResume from './request-listener-resume'
import invokePropertyAction from './invoke-property-action'
import doUpdateRequest from './do-update-request'
import publishEvent from './publish-event'
import processEvents from './process-events'
import processResetListenerAcknowledge from './process-reset-listener-acknowledge'
import processInformation from './process-information'
import processProperties from './process-properties'
import decodeXsubContent from './decode-xsub-content'
import decodeXsubTopic from './decode-xsub-topic'
import encodePubContent from './encode-pub-content'
import encodeXsubTopic from './encode-xsub-topic'
import dispose from './dispose'

const boundConnectLocalBusBroker = connectLocalBusBroker.bind(null, {
  declareListenerEventTypes,
  processIncomingMessages,
  requestListenerReset,
  requestListenerInformation,
  requestListenerPause,
  requestListenerResume,
  invokePropertyAction,
  doUpdateRequest,
  publishEvent,
  processEvents,
  processResetListenerAcknowledge,
  processInformation,
  processProperties,
  decodeXsubContent,
  decodeXsubTopic,
  encodePubContent,
  encodeXsubTopic,
  dispose,
  cuid,
  zmq
})

export default boundConnectLocalBusBroker
