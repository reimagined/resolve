import * as React from 'react'
import { Helmet } from 'react-helmet'
import { Navbar, NavbarBrand } from 'reactstrap'
import { useStaticResolver } from 'resolve-react-hooks'

const App = (): any => {
  const asset = useStaticResolver()

  return (
    <div>
      <Helmet>
        <title>reSolve Hello World TypeScript</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href={asset('/bootstrap.min.css')} />
        <link rel="icon" href={asset('favicon.ico')} />
      </Helmet>

      <Navbar color="light" light expand="md">
        <NavbarBrand className="mr-auto" href="/">
          <img src={asset('/resolve-logo.png')} alt="resolve-logo" />
          Hello World TypeScript
        </NavbarBrand>
      </Navbar>
      <h1 style={{ textAlign: 'center' }}>Hello, reSolve world!</h1>
    </div>
  )
}

export default App
