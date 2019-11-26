import React from 'react'
import { Navbar, Image, Button } from 'react-bootstrap'
import { Helmet } from 'react-helmet'
import FileUploadProgress from 'react-fileupload-progress'
import UploaderContext from '../context'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { connectReadModel } from 'resolve-redux'
import * as aggregateActions from '../aggregate_actions'

class App extends React.Component {
  state = {
    uploadId: '',
    token: '',
    uploadUrl: '',
    isHidden: true,
    isLoaded: false
  }

  handleGetUrl = () => {
    fetch('http://localhost:3000/api/uploader/getFormUpload', {
      mode: 'no-cors'
    })
      .then(response => response.json())
      .then(result =>
        this.setState({
          uploadUrl: result.form.url,
          uploadId: result.uploadId,
          isHidden: false
        })
      )

    fetch('http://localhost:3000/api/uploader/createToken', { mode: 'no-cors' })
      .then(response => response.text())
      .then(result => this.setState({ token: result }))
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
          <Helmet title="reSolve uploader test" link={links} meta={[meta]} />
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

        <div style={{ marginLeft: '2%' }}>
          <Button style={{ marginBottom: '10px' }} onClick={this.handleGetUrl}>
            Upload file
          </Button>

          <div hidden={this.state.isHidden}>
            <FileUploadProgress
              key="file"
              url={`${this.state.uploadUrl}.png`}
              method="post"
              onLoad={() => {
                this.props.createImage(this.state.uploadId, {
                  name: 'logo',
                  uploadId: this.state.uploadId
                })
                this.setState({ isLoaded: true })
              }}
            />

            <h2>
              <UploaderContext.Consumer>
                {({ port, host, protocol }) =>
                  this.state.isLoaded ? (
                    <a
                      href={`${protocol}://${host}:${port}/logo/${this.state.uploadId}.png?token=${this.state.token}`}
                    >
                      {this.state.uploadId}
                    </a>
                  ) : (
                    ''
                  )
                }
              </UploaderContext.Consumer>
            </h2>
          </div>
        </div>
      </div>
    )
  }
}

// export default App

export const mapStateToOptions = () => ({
  readModelName: 'Images',
  resolverName: '',
  resolverArgs: {}
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(null, mapDispatchToProps)(App)
)
