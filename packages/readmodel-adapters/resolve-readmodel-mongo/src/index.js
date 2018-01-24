import 'regenerator-runtime/runtime'
import { MongoClient } from 'mongodb'

import buildProjection from './build_projection'
import init from './init'
import reset from './reset'

const DEFAULT_META_COLLECTION_NAME = '__ResolveMetaCollection__'
const DEFAULT_COLLECTIONS_PREFIX = ''

export default function createMongoAdapter(
  url,
  options,
  metaCollectionName,
  collectionsPrefix
) {
  if (url.constructor !== String) {
    throw new Error('Parameter url should be string')
  }

  const repository = Object.create(null)

  repository.metaCollectionName =
    metaCollectionName && metaCollectionName.constructor === String
      ? metaCollectionName
      : DEFAULT_META_COLLECTION_NAME

  repository.collectionsPrefix =
    collectionsPrefix && collectionsPrefix.constructor === String
      ? collectionsPrefix
      : DEFAULT_COLLECTIONS_PREFIX

  repository.connectDatabase = MongoClient.connect.bind(
    MongoClient,
    url,
    options instanceof Object ? options : {}
  )

  return Object.create(null, {
    buildProjection: {
      value: buildProjection.bind(null, repository)
    },
    init: {
      value: init.bind(null, repository)
    },
    reset: {
      value: reset.bind(null, repository)
    }
  })
}
