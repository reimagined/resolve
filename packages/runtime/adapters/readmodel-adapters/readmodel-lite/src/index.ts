import _createAdapter from '@resolve-js/readmodel-base'
import SQLite from 'better-sqlite3'
//eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import tmp from 'tmp'
import os from 'os'
import fs from 'fs'

import type {
  CurrentAdapterImplementation,
  InternalMethods,
  ExternalMethods,
  CurrentStoreApi,
  AdapterPool,
  AdapterOptions,
  MemoryStore,
  AdapterApi,
} from './types'

import buildUpsertDocument from './build-upsert-document'
import _connect from './connect'
import convertBinaryRow from './convert-binary-row'
import count from './count'
import defineTable from './define-table'
import del from './delete'
import disconnect from './disconnect'
import dropReadModel from './drop-read-model'
import maybeInit from './maybe-init'
import findOne from './find-one'
import find from './find'
import insert from './insert'
import searchToWhereExpression from './search-to-where-expression'
import updateToSetExpression from './update-to-set-expression'
import update from './update'

import PassthroughError from './passthrough-error'
import generateGuid from './generate-guid'

import subscribe from './subscribe'
import resubscribe from './resubscribe'
import unsubscribe from './unsubscribe'
import reset from './reset'
import pause from './pause'
import resume from './resume'
import status from './status'
import build from './build'

const memoryStore: MemoryStore = {} as MemoryStore
const store: CurrentStoreApi = {
  defineTable,
  find,
  findOne,
  count,
  insert,
  update,
  delete: del,
}

const internalMethods: InternalMethods = {
  buildUpsertDocument,
  convertBinaryRow,
  searchToWhereExpression,
  updateToSetExpression,
  PassthroughError,
  generateGuid,
  dropReadModel,
  maybeInit,
}

const externalMethods: ExternalMethods = {
  subscribe,
  resubscribe,
  unsubscribe,
  resume,
  pause,
  reset,
  status,
  build,
}

const connect = _connect.bind(null, {
  SQLite,
  tmp,
  os,
  fs,
  memoryStore,
  ...internalMethods,
  ...externalMethods,
  ...store,
})

const implementation: CurrentAdapterImplementation = {
  ...store,
  ...externalMethods,
  connect,
  disconnect,
}

const createAdapter = _createAdapter.bind<
  null,
  CurrentAdapterImplementation,
  [AdapterOptions],
  AdapterApi<AdapterPool>
>(null, implementation)

export default createAdapter
