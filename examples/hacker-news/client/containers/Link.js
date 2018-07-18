import React from 'react'
import { connect } from 'react-redux'

import { ROUTE_CHANGED } from '../actions/actionTypes'

const Link = ({ to, children, className, style, pushRoute }) => (
  <a
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
  </a>
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
