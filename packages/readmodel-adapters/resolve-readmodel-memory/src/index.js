import 'regenerator-runtime/runtime';

import buildRead from './build_read';
import buildProjection from './build_projection';
import init from './init';
import get from './get';
import reset from './reset';

export default function createMemoryAdapter({ databaseFolder } = {}) {
    const repository = new Map();
    repository.databaseFolder = databaseFolder && databaseFolder.constructor === String
        ? databaseFolder
        : null;

    return {
        buildRead: buildRead.bind(null, repository),
        buildProjection: buildProjection.bind(null, repository),
        init: init.bind(null, repository),
        get: get.bind(null, repository),
        reset: reset.bind(null, repository)
    };
}
