import 'regenerator-runtime/runtime';

import buildProjection from './build_projection';
import init from './init';
import reset from './reset';

export default function createMemoryAdapter() {
    const repository = new Map();

    return {
        buildProjection: buildProjection.bind(null, repository),
        init: init.bind(null, repository),
        reset: reset.bind(null, repository)
    };
}
