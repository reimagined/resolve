# reSolve PostCSS Example

![Styled Components](https://user-images.githubusercontent.com/5055654/39309673-413535aa-4971-11e8-933f-5c0a8ed1a2ea.png)

This example demonstrates how to work with [postCSS](https://github.com/postcss/postcss-loader#css-modules). Get the example using this command:

```sh
npx create-resolve-app resolve-with-postcss-example -e with-postcss
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

📑 Available scripts, project structure overview, configuration files, and more useful information can be found in the [**API References**](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md) topic.

📑 Refer to the [**Architecture**](https://github.com/reimagined/resolve/blob/master/docs/Architecture.md) documentation topic to learn more about common architecture building principles.

📑 You can learn how to create simple applications with reSolve in the [**Tutorials**](https://github.com/reimagined/resolve/tree/master/docs/Tutorials) section.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/examples-with-postcss-modules-readme?pixel)

