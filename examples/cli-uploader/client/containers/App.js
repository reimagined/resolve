import React from 'react'
import { connect } from 'react-redux'
import { connectReadModel } from '@resolve-js/redux'
import { Button, Label } from 'reactstrap'

import Login from '../components/Login'

class App extends React.Component {
  state = {
    loadingState: {},
  }
  linkOpener = null

  componentDidMount() {
    this.linkOpener = (url) => window.open(url)
  }
  componentWillUnmount() {
    this.linkOpener = null
  }

  getFileUrl = async (uploadId, index) => {
    this.setState({
      loadingState: { ...this.state.loadingState, [index]: true },
    })
    try {
      const url = await fetch(
        `/api/uploader/getFileUrl?uploadId=${uploadId}`
      ).then((response) => response.text())

      this.linkOpener(`${this.props.CDNUrl}${url}`)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error)
    }

    this.setState({
      loadingState: { ...this.state.loadingState, [index]: false },
    })
  }

  render() {
    return this.props.jwt == null ? (
      <Login />
    ) : (
      <div>
        {this.props.files == null || this.props.files.length === 0
          ? 'No uploaded files'
          : this.props.files.map((file, index) => {
              const { id, userId, projectId, status } = file
              const data = `${
                index + 1
              }. File: ${id} { Loading-status: ${status}, User: ${userId}, Project: ${projectId} }`

              if (this.props.jwt.login === userId && status === 'success') {
                return (
                  <div key={index}>
                    <Label>{data}</Label>
                    <Button
                      color="link"
                      disabled={!!this.state.loadingState[index]}
                      onClick={this.getFileUrl.bind(this, id, index)}
                    >
                      Get file
                    </Button>
                  </div>
                )
              }

              return <div key={index}>{data}</div>
            })}
      </div>
    )
  }
}

export const mapStateToOptions = () => ({
  readModelName: 'Files',
  resolverName: 'allFiles',
  resolverArgs: {},
})

const mapStateToProps = (state, { data }) => ({
  files: data,
  jwt: state.jwt,
})

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps)(App)
)
