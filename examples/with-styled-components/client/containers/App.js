import React from 'react'
import styled from 'styled-components'

export const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`

export const Wrapper = styled.section`
  margin: 0 10px;
  padding: 4em;
  background: papayawhip;
`

export const App = () => (
  <Wrapper>
    <Title>Hello World, this is my first styled component!</Title>
  </Wrapper>
)

export default App
