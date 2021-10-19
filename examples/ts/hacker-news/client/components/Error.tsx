import React from 'react'
import queryString from 'query-string'
import styled from 'styled-components'
import { Location } from 'history'

const Title = styled.div`
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 0.2em;
`

const Error = ({ location }: { location: Location }) => (
  <div>
    <Title>Error</Title>
    {queryString.parse(location.search).text}
  </div>
)

export { Error }
