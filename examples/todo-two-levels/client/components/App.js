import React from 'react'
import { Switch, Route } from 'react-router'

import Todo from './Todo'
import Index from './Index'

export default () => (
  <Switch>
    <Route path="/:id" component={Todo} />
    <Route path="/" component={Index} />
  </Switch>
)
