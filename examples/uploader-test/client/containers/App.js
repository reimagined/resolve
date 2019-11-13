import React from 'react'
import { Navbar, Image, Button } from 'react-bootstrap'
import { Helmet } from 'react-helmet'

import UploaderContext from '../context'

class App extends React.Component {
  state = {
    text: ''
  }

  handleButton = () => {
    fetch('http://localhost:3000/api/upload', { mode: 'no-cors' })
      .then(response => response.text())
      .then(result => this.setState({ text: result }))
  }

  render() {
    const stylesheetLink = {
      rel: 'stylesheet',
      type: 'text/css',
      href: `${this.props.staticPath}/bootstrap.min.css`
    }
    const faviconLink = {
      rel: 'icon',
      type: 'image/png',
      href: `${this.props.staticPath}/favicon.ico`
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
              <Image src={`${this.props.staticPath}/resolve-logo.png`} />{' '}
              Uploader Test
            </Navbar.Text>

            <Navbar.Collapse>
              <Navbar.Text pullRight>
                <Navbar.Link href="https://facebook.com/resolvejs/">
                  <Image src={`${this.props.staticPath}/fb-logo.png`} />
                </Navbar.Link>
              </Navbar.Text>

              <Navbar.Text pullRight>
                <Navbar.Link href="https://twitter.com/resolvejs">
                  <Image src={`${this.props.staticPath}/twitter-logo.png`} />
                </Navbar.Link>
              </Navbar.Text>

              <Navbar.Text pullRight>
                <Navbar.Link href="https://github.com/reimagined/resolve">
                  <Image src={`${this.props.staticPath}/github-logo.png`} />
                </Navbar.Link>
              </Navbar.Text>
            </Navbar.Collapse>
          </Navbar>
        </div>
        <div style={{ 'text-align': 'center' }}>
          <Button onClick={this.handleButton}>Upload</Button>
        </div>
        <h2 align="center">
          <UploaderContext.Consumer>
            {({ port, host, protocol, bucket }) =>
              this.state.text !== '' ? (
                <a
                  href={`${protocol}://${host}:${port}/${bucket}/${this.state.text}`}
                >
                  {this.state.text}
                </a>
              ) : (
                ''
              )
            }
          </UploaderContext.Consumer>
        </h2>
      </div>
    )
  }
}

export default App
