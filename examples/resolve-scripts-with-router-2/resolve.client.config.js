import React from 'react'
import rootRoute from './index'
import { Router, browserHistory } from 'react-router'

export default {
  rootComponent: () => <Router history={browserHistory}>{rootRoute}</Router>
}
