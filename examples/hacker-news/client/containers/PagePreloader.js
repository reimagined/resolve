import React from 'react'
import { connect } from 'react-redux'
import { matchRoutes } from 'react-router-config'

import routes from '../routes'

const PagePreloader = ({ route }) => {
  let children = []
  if (route != null) {
    let index = 0
    for (const {
      route: { component: Component },
      match
    } of matchRoutes(routes, route)) {
      if (match.path !== '/') {
        children.push(<Component key={index++} match={match} />)
      }
    }
  }
  return (
    <div style={{ display: 'none' }}>
      {children.length > 0 ? children : null}
    </div>
  )
}

const mapStateToProps = state => ({
  route: state.prefetchRoute
})

export default connect(mapStateToProps)(PagePreloader)
