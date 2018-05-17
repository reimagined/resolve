import React from 'react'
import { Navbar, Image } from 'react-bootstrap'

const Header = () => (
  <div>
    <nav className="navbar navbar-light bg-light">
      <div className="container">
        <Navbar.Text>
          <Image src="/resolve-logo.png" />
          {' Saga example'}
        </Navbar.Text>

        <div className="navbar-collapse">
          <Navbar.Text pullRight>
            <Navbar.Link href="https://facebook.com/resolvejs/">
              <Image src="/fb-logo.png" />
            </Navbar.Link>
          </Navbar.Text>

          <Navbar.Text pullRight>
            <Navbar.Link href="https://twitter.com/resolvejs">
              <Image src="/twitter-logo.png" />
            </Navbar.Link>
          </Navbar.Text>

          <Navbar.Text pullRight>
            <Navbar.Link href="https://github.com/reimagined/resolve">
              <Image src="/github-logo.png" />
            </Navbar.Link>
          </Navbar.Text>
        </div>
      </div>
    </nav>
  </div>
)

export default Header
