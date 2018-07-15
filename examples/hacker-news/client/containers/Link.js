import React from 'react'
import { connect } from 'react-redux'
import { connectRootBasedUrls } from 'resolve-redux'

import { ROUTE_CHANGED } from '../actions/actionTypes'

const RootBasedA = connectRootBasedUrls(['href'])('a')

const Link = ({ to, children, className, style, pushRoute }) => (
  <RootBasedA
    className={className}
    style={style}
    href={to}
    onClick={event => {
      event.preventDefault()
      event.stopPropagation()
      setTimeout(() => {
        if (pushRoute) {
          pushRoute(to)
        }
      }, 0)
      return false
    }}
  >
    {children}
  </RootBasedA>
)

const mapDispatchToProps = dispatch => ({
  pushRoute: route =>
    dispatch({
      type: ROUTE_CHANGED,
      route
    })
})

export default connect(
  null,
  mapDispatchToProps
)(Link)
