import React from 'react'
import queryString from 'query-string'

const Error = ({ location }) => (
  <div>
    <h1>Error</h1>
    {queryString.parse(location.search).text}
  </div>
)

export default Error
