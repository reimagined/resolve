# With PostCSS Example

![Styled Components](https://user-images.githubusercontent.com/5055654/39309673-413535aa-4971-11e8-933f-5c0a8ed1a2ea.png)

This example demonstrates how to work with [postCSS](https://github.com/postcss/postcss-loader#css-modules). To install:

```bash
npx create-resolve-app with-postcss -e with-postcss
```

## How to Use

```jsx
import React from 'react'

import styles from './App.css'

export const App = () => (
  <div className={styles.wrapper}>
    <div className={styles.title}>
      Hello World, this is my first component with postcss-modules!
    </div>
  </div>
)

export default App
```

## What's next?

📑 Available scripts, project structure overview, configuration files and much other useful information are in [**API References**](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md) topic.

📑 To learn more about common building principles of architecture, please look at [**Architecture**](https://github.com/reimagined/resolve/blob/master/docs/Architecture.md) documentation topic.

📑 In [**Tutorials**](https://github.com/reimagined/resolve/tree/master/docs/Tutorials) you can find how to make some simple applications with reSolve.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/examples-with-postcss-modules-readme?pixel)
