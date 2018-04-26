# With PostCSS Modules

-------------------------------------------------------------------------
**See the documentation at [postcss/postcss-loader](https://github.com/postcss/postcss-loader#css-modules)** for more information about using `postcss`!

### Example

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

This is what you'll see in your browser:

![Styled Components](https://user-images.githubusercontent.com/5055654/39309673-413535aa-4971-11e8-933f-5c0a8ed1a2ea.png)
