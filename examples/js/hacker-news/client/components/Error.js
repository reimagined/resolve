import React from 'react'
import queryString from 'query-string'
import styled from 'styled-components'
const Title = styled.div`
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 0.2em;
`
const Error = ({ location }) =>
  React.createElement(
    'div',
    null,
    React.createElement(Title, null, 'Error'),
    queryString.parse(location.search).text
  )
export { Error }
