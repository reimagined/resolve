# reSolve Styled Components Example

![Styled Components](https://camo.githubusercontent.com/640c2142e506d4b61bdd29513cb2cdbddbd4aa2f/687474703a2f2f692e696d6775722e636f6d2f77554a70636a592e6a7067)

This example demonstrates how to work with [Styled Components](https://www.styled-components.com/docs).

##### Installation:

```sh
npx create-resolve-app resolve-with-styled-components-example -e styled-components
```

## How to Use

```jsx
import React from 'react'

import styled from 'styled-components'

// Create a <Title> react component that renders a <h1> which is
// centered, colored in palevioletred and sized at 1.5em
const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`

// Create a <Wrapper> react component that renders a <section> with
// some padding and a papayawhip background
const Wrapper = styled.section`
  padding: 4em;
  background: papayawhip;
`

// Use them like any other React component – except they're styled!
;<Wrapper>
  <Title>Hello World, this is my first styled component!</Title>
</Wrapper>
```

## What's next?

📑 [**Getting started**](https://www.styled-components.com/docs/basics) for styled-components.

📑 [**Theming**](https://www.styled-components.com/docs/advanced#theming) for styled-components.

📑 [**Server-side rendering**](https://www.styled-components.com/docs/advanced#server-side-rendering) for styled-components.

📑 [**Tagged Template Literals**](https://www.styled-components.com/docs/advanced#tagged-template-literals) for styled-components.

📑 Available scripts, project structure overview, configuration files, and more useful information can be found in the [**API References**](https://reimagined.github.io/resolve/docs/api-reference) topic.

📑 You can learn how to create simple applications with reSolve in the [**Step-by-Step Tutorial**](https://reimagined.github.io/resolve/docs/tutorial).

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/examples-with-styled-components-readme?pixel)
