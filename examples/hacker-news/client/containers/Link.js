import React from 'react'

import { ROUTE_CHANGED } from '../actions/actionTypes'
import { connect } from 'react-redux'

const Link = ({ to, children, className, style, pushRoute }) => (
  <a
    className={className}
    style={style}
    href={to}
    onClick={event => {
      event.preventDefault()
      event.cancelBubble = true
      event.returnValue = false
      setTimeout(() => pushRoute(to), 0)
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
