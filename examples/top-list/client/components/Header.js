import React from 'react'
import { Navbar, Image } from 'react-bootstrap'

const Header = () => (
  <div>
    <Navbar>
      <Navbar.Text>
        <Image src="../../static/resolve-logo.png" /> Top List Example
      </Navbar.Text>

      <Navbar.Collapse>
        <Navbar.Text pullRight>
          <Navbar.Link href="https://facebook.com/resolvejs/">
            <Image src="../../static/fb-logo.png" />
          </Navbar.Link>
        </Navbar.Text>

        <Navbar.Text pullRight>
          <Navbar.Link href="https://twitter.com/resolvejs">
            <Image src="../../static/twitter-logo.png" />
          </Navbar.Link>
        </Navbar.Text>

        <Navbar.Text pullRight>
          <Navbar.Link href="https://github.com/reimagined/resolve">
            <Image src="../../static/github-logo.png" />
          </Navbar.Link>
        </Navbar.Text>
      </Navbar.Collapse>
    </Navbar>
  </div>
)

export default Header
