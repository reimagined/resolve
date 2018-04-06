import React from 'react'
import { Navbar, Image } from 'react-bootstrap'

const Header = () => (
  <div>
    <Navbar>
      <Navbar.Text>
        <Image src="/resolve-logo.png" /> Todo Example
      </Navbar.Text>

      <Navbar.Collapse>
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
      </Navbar.Collapse>
    </Navbar>
  </div>
)

export default Header
