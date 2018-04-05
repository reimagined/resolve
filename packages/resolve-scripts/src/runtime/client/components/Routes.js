import React from 'react'
import { Route, Redirect, Switch } from 'react-router'

const Routes = ({ path, component: Component, routes, exact, redirectTo }) => {
  if (redirectTo) {
    return <Redirect from={path} to={redirectTo} />
  }

  return routes ? (
    <Route
      path={path}
      exact={exact}
      render={props => {
        const content = (
          <Switch>
            {routes.map((route, index) => <Routes key={index} {...route} />)}
          </Switch>
        )
        return Component ? <Component {...props}>{content}</Component> : content
      }}
    />
  ) : (
    <Route path={path} exact={exact} component={Component} />
  )
}

export default Routes
