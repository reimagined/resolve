import React from 'react'
import styled from 'styled-components'
import { useSearchParams } from 'react-router-dom'

const Title = styled.div`
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 0.2em;
`

const Error = () => {
  let [searchParams] = useSearchParams()

  return (
    <div>
      <Title>Error</Title>
      {searchParams.get('text') ?? 'Unknown error'}
    </div>
  )
}

export { Error }
