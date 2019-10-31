import React from 'react'
import { Navbar, Image } from 'react-bootstrap'
import { Helmet } from 'react-helmet'

const App = ({ staticPath }) => {
  const stylesheetLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: `${staticPath}/bootstrap.min.css`
  }
  const faviconLink = {
    rel: 'icon',
    type: 'image/png',
    href: `${staticPath}/favicon.ico`
  }
  const links = [stylesheetLink, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1'
  }

  return (
    <div>
      <div>
        <Helmet title="reSolve Hello World" link={links} meta={[meta]} />
        <Navbar>
          <Navbar.Text>
            <Image src={`${staticPath}/resolve-logo.png`} /> Hello World Example
          </Navbar.Text>

          <Navbar.Collapse>
            <Navbar.Text pullRight>
              <Navbar.Link href="https://facebook.com/resolvejs/">
                <Image src={`${staticPath}/fb-logo.png`} />
              </Navbar.Link>
            </Navbar.Text>

            <Navbar.Text pullRight>
              <Navbar.Link href="https://twitter.com/resolvejs">
                <Image src={`${staticPath}/twitter-logo.png`} />
              </Navbar.Link>
            </Navbar.Text>

            <Navbar.Text pullRight>
              <Navbar.Link href="https://github.com/reimagined/resolve">
                <Image src={`${staticPath}/github-logo.png`} />
              </Navbar.Link>
            </Navbar.Text>
          </Navbar.Collapse>
        </Navbar>
      </div>
      <h1 align="center">Hello, reSolve world!</h1>
    </div>
  )
}

export default App
