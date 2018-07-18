import React from 'react'
import { Helmet } from 'react-helmet'
import styled from 'styled-components'

export const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`

export const Wrapper = styled.section`
  padding: 4em;
  background: papayawhip;
`

export const App = () => (
  <Wrapper>
    <Helmet>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>reSolve Styled Components Example</title>
    </Helmet>
    <Title>Hello World, this is my first styled component!</Title>
  </Wrapper>
)

export default App
