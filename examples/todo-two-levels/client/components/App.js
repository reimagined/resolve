import React from 'react';
import { Switch, Route } from 'react-router';

import Todo from './Todo';
import Index from './Index';

export default () => (
    <div>
        <Switch>
            <Route path="/:id" component={Todo} />
            <Route path="/" component={Index} />
        </Switch>
    </div>
);
