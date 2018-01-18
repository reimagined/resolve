import 'regenerator-runtime/runtime';
import NeDB from 'nedb';

import buildProjection from './build_projection';
import init from './init';
import reset from './reset';

export default function createMemoryAdapter() {
    const repository = Object.create(null);

    repository.createNedbCollection = () => new NeDB({ autoload: true, inMemoryOnly: true });

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
    });
}
