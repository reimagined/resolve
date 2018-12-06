import React from 'react'
import { Image, Navbar } from 'react-bootstrap'
import { connectStaticBasedUrls } from 'resolve-redux'

const ConnectedImage = connectStaticBasedUrls(['src'])(Image)

class Logo extends React.PureComponent {
  render() {
    return (
      <Navbar.Header>
        <Navbar.Brand>
          <ConnectedImage className="example-icon" src="/resolve-logo.png" />
          Shopping List
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar.Header>
    )
  }
}

export default Logo
