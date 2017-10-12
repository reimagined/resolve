import 'regenerator-runtime/runtime';

import buildRead from './build_read'
import buildProjection from './build_projection'
import init from './init'
import get from './get'
import reset from './reset'

export default function createMemoryAdapter() {
    const repository = new Map();

    return {
        buildRead: buildRead.bind(null, repository),
        buildProjection: buildProjection.bind(null, repository),
        init: init.bind(null, repository),
        get: get.bind(null, repository),
        reset: reset.bind(null, repository)
    };
}
