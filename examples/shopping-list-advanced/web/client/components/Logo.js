import React from 'react'
import { Image } from 'react-bootstrap'
import { connectStaticBasedUrls } from 'resolve-redux'

const ConnectedImage = connectStaticBasedUrls(['src'])(Image)

class Logo extends React.PureComponent {
  render() {
    return <ConnectedImage className="example-icon" src="/resolve-logo.png" />
  }
}

export default Logo
