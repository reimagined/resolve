import React from 'react'
import { Route, IndexRoute, Link } from 'react-router'

const NavigationComponent = () => (
  <div>
    <Link to="/">Home</Link>
    <Link to="/about">About</Link>
  </div>
)

const HomeComponent = () => (
  <div>
    <NavigationComponent />
    <h1>Home</h1>
  </div>
)

const AboutComponent = () => (
  <div>
    <NavigationComponent />
    <h1>About</h1>
  </div>
)

export default (
  <Route path="/">
    <IndexRoute component={HomeComponent} />
    <Route path="/about" component={AboutComponent} />
  </Route>
)
