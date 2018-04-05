# With Styled Components

-------------------------------------------------------------------------
**See the documentation at [styled-components.com/docs](https://www.styled-components.com/docs)** for more information about using `styled-components`!

Quicklinks to some of the most-visited pages:

* [**Getting started**](https://www.styled-components.com/docs/basics)
* [API Reference](https://styled-components.com/docs/api)
* [Theming](https://www.styled-components.com/docs/advanced#theming)
* [Server-side rendering](https://www.styled-components.com/docs/advanced#server-side-rendering)
* [Tagged Template Literals explained](https://www.styled-components.com/docs/advanced#tagged-template-literals)

### Example

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

This is what you'll see in your browser:

![Styled Components](https://camo.githubusercontent.com/640c2142e506d4b61bdd29513cb2cdbddbd4aa2f/687474703a2f2f692e696d6775722e636f6d2f77554a70636a592e6a7067)