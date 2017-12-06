import 'regenerator-runtime/runtime';

import buildProjection from './build_projection';
import init from './init';
import reset from './reset';

export default function createMongoAdapter(url, options) {
    if (url.constructor !== String) {
        throw new Error('Parameter url should be string');
    }
    const repository = Object.create(null);
    repository.url = url;
    repository.options = options instanceof Object ? options : {};

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
