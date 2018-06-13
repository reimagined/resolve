import React from 'react'
import { Helmet } from 'react-helmet'

import styles from './App.css'

export const App = () => (
  <div className={styles.wrapper}>
    <Helmet>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="/styles/bundle.css" />
      <title>reSolve With PostCSS Example</title>
    </Helmet>
    <div className={styles.title}>
      Hello World, this is my first component with postcss-modules!
    </div>
  </div>
)

export default App
