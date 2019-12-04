import React from 'react'
import {
  Form,
  Input,
  Label,
  Button,
  CardColumns,
  Card,
  CardBody,
  CardImg,
  CardTitle,
  FormGroup,
  CustomInput
} from 'reactstrap'
import FileUploadProgress from 'react-fileupload-progress'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { connectReadModel } from 'resolve-redux'

import UploaderContext from '../context'
import * as aggregateActions from '../aggregate_actions'

class App extends React.Component {
  state = {
    uploadId: '',
    uploadUrl: '',
    token: '',
    staticToken: '',
    mimeType: '',
    nameFile: '',
    isHidden: true,
    isLoaded: false
  }

  componentDidMount() {
    fetch('/api/uploader/getStaticToken', {
      mode: 'no-cors'
    })
      .then(response => response.text())
      .then(result => this.setState({ staticToken: result }))
  }

  handleGetUrl = () => {
    fetch('/api/uploader/getFormUpload?dir=logo', {
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

    fetch('/api/uploader/getToken?dir=logo', { mode: 'no-cors' })
      .then(response => response.text())
      .then(result => this.setState({ token: result }))
  }

  handleChange = event => this.setState({ nameFile: event.target.value })

  ref = React.createRef()

  customFormRender = onSubmit => {
    return (
      <Form id="customForm">
        <FormGroup>
          <Label>File input</Label>
          <CustomInput type="file" name="file" id="input" innerRef={this.ref} />
        </FormGroup>
        <Input
          type="text"
          value={this.state.nameFile}
          placeholder="File name"
          onChange={this.handleChange}
        />
        <br />
        <Button
          outline
          color="success"
          onClick={(...args) => {
            this.setState({ mimeType: this.ref.current.files[0].type })
            onSubmit(...args)
          }}
        >
          Upload
        </Button>
      </Form>
    )
  }

  formGetter = () => {
    return new FormData(document.getElementById('customForm'))
  }

  render() {
    return (
      <UploaderContext.Consumer>
        {({ CDNUrl }) => (
          <div>
            <div style={{ padding: '10px' }}>
              <Button
                outline
                color="primary"
                style={{ marginBottom: '10px' }}
                onClick={this.handleGetUrl}
              >
                Upload file
              </Button>

              <div hidden={this.state.isHidden}>
                <FileUploadProgress
                  key="file"
                  url={`${this.state.uploadUrl}&type=${encodeURIComponent(
                    this.state.mimeType
                  )}`}
                  method="post"
                  formRenderer={this.customFormRender}
                  formGetter={this.formGetter}
                  onLoad={() => {
                    const name =
                      this.state.nameFile === ''
                        ? 'Default name'
                        : this.state.nameFile
                    this.props.createImage(this.state.uploadId, {
                      name,
                      uploadId: this.state.uploadId
                    })
                    this.setState({ isLoaded: true })
                  }}
                />

                <h2>
                  {this.state.isLoaded ? (
                    <a
                      href={`${CDNUrl}/logo/${this.state.uploadId}?token=${this.state.token}`}
                    >
                      {this.state.uploadId}
                    </a>
                  ) : (
                    ''
                  )}
                </h2>
              </div>
            </div>

            <CardColumns>
              {this.props.data != null
                ? this.props.data.map((image, index) => (
                    <Card key={index}>
                      <CardImg
                        width="300px"
                        src={`${CDNUrl}/logo/${image.uploadId}?token=${this.state.staticToken}`}
                      />

                      <CardBody>
                        <CardTitle>{`${index + 1}: ${image.name}`}</CardTitle>
                      </CardBody>
                    </Card>
                  ))
                : ''}
            </CardColumns>
          </div>
        )}
      </UploaderContext.Consumer>
    )
  }
}

export const mapStateToOptions = () => ({
  readModelName: 'Images',
  resolverName: 'allImages',
  resolverArgs: {}
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(null, mapDispatchToProps)(App)
)
