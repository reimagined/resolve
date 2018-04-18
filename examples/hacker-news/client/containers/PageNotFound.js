import React from 'react'
import { connectReadModel } from 'resolve-redux'

const PageNotFound = () => (
  <div>
    <h1>Page not found</h1>
  </div>
)

export default connectReadModel((state, ownProps) => ({
  readModelName: 'default',
  resolverName: 'void',
  parameters: {},
  ...ownProps
}))(PageNotFound)
