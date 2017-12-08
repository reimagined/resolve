import 'regenerator-runtime/runtime';
import { MongoClient } from 'mongodb';

import buildProjection from './build_projection';
import init from './init';
import reset from './reset';

const DEFAULT_META_COLLECTION_NAME = '__ResolveMetaCollection__';

export default function createMongoAdapter(url, options, metaCollectionName) {
    if (url.constructor !== String) {
        throw new Error('Parameter url should be string');
    }
    const repository = Object.create(null);
    repository.url = url;
    repository.options = options instanceof Object ? options : {};
    repository.metaCollectionName = metaCollectionName || DEFAULT_META_COLLECTION_NAME;

    return Object.create(null, {
        buildProjection: {
            value: buildProjection.bind(null, repository)
        },
        init: {
            value: init.bind(null, repository, MongoClient)
        },
        reset: {
            value: reset.bind(null, repository)
        }
    });
}
