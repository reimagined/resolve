import { actionTypes } from 'resolve-redux'
import { routerActions, LOCATION_CHANGE } from 'react-router-redux'
import { ROUTE_CHANGED } from '../actions/action_types'

const {
  LOAD_VIEWMODEL_STATE_SUCCESS,
  LOAD_READMODEL_STATE_SUCCESS
} = actionTypes

const routeChangeMiddleware = store => next => action => {
  if (action.type === LOCATION_CHANGE) {
    setTimeout(() => {
      store.dispatch({
        type: ROUTE_CHANGED,
        route: null
      })
    }, 1000)
  }
  if (
    action.type === LOAD_VIEWMODEL_STATE_SUCCESS ||
    action.type === LOAD_READMODEL_STATE_SUCCESS
  ) {
    const route = store.getState().prefetchRoute
    if (route) {
      store.dispatch(routerActions.push(route))
    }
  }

  next(action)
}

export default routeChangeMiddleware
