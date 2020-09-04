import createAdapter from 'resolve-eventstore-base';
import sqlite from 'sqlite';
import tmp from 'tmp';
import os from 'os';
import fs from 'fs';

import loadEventsByCursor from './js/load-events-by-cursor';
import loadEventsByTimestamp from './js/load-events-by-timestamp';
import getLatestEvent from './js/get-latest-event';
import saveEvent from './js/save-event';
import injectEvent from './js/inject-event';
import freeze from './js/freeze';
import unfreeze from './js/unfreeze';
import shapeEvent from './js/shape-event';
import loadSnapshot from './js/load-snapshot';
import dropSnapshot from './js/drop-snapshot';
import saveSnapshot from './js/save-snapshot';
import beginIncrementalImport from './js/begin-incremental-import';
import commitIncrementalImport from './js/commit-incremental-import';
import rollbackIncrementalImport from './js/rollback-incremental-import';
import pushIncrementalImport from './js/push-incremental-import';

import connect from './connect';
import init from './init';
import drop from './drop';
import dispose from './dispose';
import getSecretsManager from './secrets-manager';

const wrappedCreateAdapter = createAdapter.bind(null, {
  connect,
  loadEventsByCursor,
  loadEventsByTimestamp,
  getLatestEvent,
  saveEvent,
  init,
  drop,
  dispose,
  injectEvent,
  freeze,
  unfreeze,
  shapeEvent,
  getSecretsManager,
  saveSnapshot,
  dropSnapshot,
  loadSnapshot,
  beginIncrementalImport,
  commitIncrementalImport,
  rollbackIncrementalImport,
  pushIncrementalImport,
  sqlite,
  tmp,
  os,
  fs,
});

export default wrappedCreateAdapter;
