import React from 'react';
import { StaticRouter } from 'react-router';

import RootComponent from './index';

export default {
    entries: {
        rootComponent: (props, context) => (
            <StaticRouter location={props.url} context={{}}>
                <RootComponent />
            </StaticRouter>
        )
    }
};
