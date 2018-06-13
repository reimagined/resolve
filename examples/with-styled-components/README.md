# With Styled Components Example

![Styled Components](https://camo.githubusercontent.com/640c2142e506d4b61bdd29513cb2cdbddbd4aa2f/687474703a2f2f692e696d6775722e636f6d2f77554a70636a592e6a7067)

This example demonstrates how to work with [styled-components](https://www.styled-components.com/docs). To install:

```bash
npx create-resolve-app with-styled-components -e with-styled-components
```

## How to Use

```jsx
import React from 'react';

import styled from 'styled-components';

// Create a <Title> react component that renders an <h1> which is
// centered, palevioletred and sized at 1.5em
const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`;

// Create a <Wrapper> react component that renders a <section> with
// some padding and a papayawhip background
const Wrapper = styled.section`
  padding: 4em;
  background: papayawhip;
`;

// Use them like any other React component – except they're styled!
<Wrapper>
  <Title>Hello World, this is my first styled component!</Title>
</Wrapper>
```

## What's next?

📑 [**Getting started**](https://www.styled-components.com/docs/basics) for styled-components.

📑 [**Theming**](https://www.styled-components.com/docs/advanced#theming) for styled-components.

📑 [**Server-side rendering**](https://www.styled-components.com/docs/advanced#server-side-rendering) for styled-components.

📑 [**Tagged Template Literals explaination**](https://www.styled-components.com/docs/advanced#tagged-template-literals) for styled-components.

📑 Available scripts, project structure overview, configuration files and much other useful information are in [**API References**](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md) topic.

📑 To learn more about common building principles of architecture, please look at [**Architecture**](https://github.com/reimagined/resolve/blob/master/docs/Architecture.md) documentation topic.

📑 In [**Tutorials**](https://github.com/reimagined/resolve/tree/master/docs/Tutorials) you can find how to make some simple applications with reSolve.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/examples-with-styled-components-readme?pixel)
