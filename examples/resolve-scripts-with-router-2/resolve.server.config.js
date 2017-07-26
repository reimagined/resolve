import React from 'react';
import { RouterContext, match, createRoutes } from 'react-router';

import rootRoute from './index';

const ServerRouter = ({ url }) => {
    let jsx = null;

    match({ routes: createRoutes(rootRoute), location: url }, (error, redirect, renderProps) => {
        if (!error && !redirect && renderProps) {
            jsx = <RouterContext {...renderProps} />;
        } else {
            jsx = <div>Error {error}</div>;
        }
    });

    return jsx;
};

export default {
    entries: {
        rootComponent: ServerRouter
    }
};
