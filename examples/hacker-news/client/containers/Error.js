import React from 'react'
import { connectReadModel } from 'resolve-redux'
import queryString from 'query-string'

const Error = ({ location }) => (
  <div>
    <h1>Error</h1>
    {queryString.parse(location.search).text}
  </div>
)

export default connectReadModel((state, ownProps) => ({
  readModelName: 'default',
  resolverName: 'void',
  variables: {},
  ...ownProps
}))(Error)
