import React from 'react'
import queryString from 'query-string'
import styled from 'styled-components'

const Title = styled.div`
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 0.2em;
`

const Error = ({ location }) => (
  <div>
    <Title>Error</Title>
    {queryString.parse(location.search).text}
  </div>
)

export default Error
