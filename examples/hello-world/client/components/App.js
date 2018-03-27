import React from 'react'
import { Helmet } from 'react-helmet'
import Header from './Header.js'

const RootComponent = () => (
  <div>
    <Helmet>
      <link
        rel="stylesheet"
        href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
        integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"
        crossorigin="anonymous"
      />
    </Helmet>

    <Header />

    <h1 align="center">Hello, reSolve world!</h1>
  </div>
)

export default RootComponent
