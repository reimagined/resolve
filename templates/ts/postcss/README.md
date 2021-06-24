# reSolve PostCSS Example

![Styled Components](https://user-images.githubusercontent.com/5055654/39309673-413535aa-4971-11e8-933f-5c0a8ed1a2ea.png)

An application pre-configured to use [PostCSS](https://github.com/postcss/postcss-loader#css-modules).

To create a project:

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

📑 Available scripts, project structure overview, configuration files, and more useful information can be found in the [**API References**](https://reimagined.github.io/resolve/docs/api-reference) topic.

📑 You can learn how to create simple applications with reSolve in the [**Step-by-Step Tutorial**](https://reimagined.github.io/resolve/docs/tutorial).

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/examples-with-postcss-modules-readme?pixel)
