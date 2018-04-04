import React from 'react'
import { Helmet } from 'react-helmet'
import Header from '../components/Header.js'

const App = () => (
  <div>
    <Helmet>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="/bootstrap.min.css" />
      <title>reSolve Hello World</title>
    </Helmet>

    <Header />

    <h1 align="center">Hello, reSolve world!</h1>
  </div>
)

export default App
