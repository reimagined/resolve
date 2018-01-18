import 'regenerator-runtime/runtime';

import buildProjection from './build_projection';
import init from './init';
import reset from './reset';

export default function createMemoryAdapter() {
    const repository = Object.create(null);

    repository.constructStorage = async (type) => {
        switch (type) {
            case 'Dictionary':
                return new Map();
            default:
                throw new Error('Wrong type');
        }
    };

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
