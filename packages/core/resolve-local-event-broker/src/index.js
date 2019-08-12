import cuid from 'cuid'
import sqlite from 'sqlite'
import zmq from 'resolve-zeromq'

import adjustEventBatch from './adjust-event-batch'
import anycastEvents from './anycast-events'
import checkOptionShape from './check-option-shape'
import createAndInitBroker from './create-and-init-broker'
import decodeXpubTopic from './decode-xpub-topic'
import dispose from './dispose'
import encodePubContent from './encode-pub-content'
import encodeXpubTopic from './encode-xpub-topic'
import followTopicBatchStep from './follow-topic-batch-step'
import followTopic from './follow-topic'
import getListenerInfo from './get-listener-info'
import handlePropertyAction from './handle-property-action'
import interlockPromise from './interlock-promise'
import initDatabase from './init-database'
import initSockets from './init-sockets'
import onAcknowledgeBatchTopic from './on-acknowledge-batch-topic'
import onDeclareEventTypesTopic from './on-declare-event-types-topic'
import onEventTopic from './on-event-topic'
import onInformationTopic from './on-information-topic'
import onPauseListenerTopic from './on-pause-listener-topic'
import onPropertiesTopic from './on-properties-topic'
import onResetListenerTopic from './on-reset-listener-topic'
import onResumeListenerTopic from './on-resume-listener-topic'
import onSubMessage from './on-sub-message'
import onXpubMessage from './on-xpub-message'
import rewindListener from './rewind-listener'
import updateListenerInfo from './update-listener-info'
import wrapWithQueue from './wrap-with-queue'

const boundAdapter = createAndInitBroker.bind(null, {
  adjustEventBatch,
  anycastEvents,
  checkOptionShape,
  createAndInitBroker,
  decodeXpubTopic,
  dispose,
  encodePubContent,
  encodeXpubTopic,
  followTopicBatchStep,
  followTopic,
  getListenerInfo,
  handlePropertyAction,
  initDatabase,
  initSockets,
  interlockPromise,
  onAcknowledgeBatchTopic,
  onDeclareEventTypesTopic,
  onEventTopic,
  onInformationTopic,
  onPauseListenerTopic,
  onPropertiesTopic,
  onResetListenerTopic,
  onResumeListenerTopic,
  onSubMessage,
  onXpubMessage,
  rewindListener,
  updateListenerInfo,
  wrapWithQueue,
  cuid,
  sqlite,
  zmq
})

export default boundAdapter
