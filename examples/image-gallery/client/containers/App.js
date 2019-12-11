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
import {
  getCDNBasedUrl,
  getFormUpload,
  getToken
} from 'resolve-module-uploader'

import UploaderContext from '../context'
import * as aggregateActions from '../aggregate_actions'

class App extends React.Component {
  state = {
    form: {},
    uploadId: '',
    token: '',
    staticToken: '',
    mimeType: '',
    nameFile: '',
    isHidden: true,
    isLoaded: false
  }

  componentDidMount() {
    getToken({ dir: 'logo' }).then(token =>
      this.setState({ staticToken: token })
    )
  }

  handleGetUrl = () => {
    getFormUpload({ dir: 'logo' }).then(result =>
      this.setState({
        form: result.form,
        uploadId: result.uploadId,
        isHidden: false
      })
    )

    getToken({ dir: 'logo' }).then(token => this.setState({ token }))
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
        <Input type="hidden" name="Content-Type" value={this.state.mimeType} />
        {this.state.form.fields != null
          ? Object.keys(this.state.form.fields).map((key, index) => (
              <Input
                key={index}
                name={key}
                value={this.state.form.fields[key]}
                type="hidden"
              />
            ))
          : ''}
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
                  url={`${this.state.form.url}&type=${encodeURIComponent(
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
                      href={getCDNBasedUrl({
                        CDNUrl,
                        dir: 'logo',
                        uploadId: this.state.uploadId,
                        token: this.state.token
                      })}
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
                        src={getCDNBasedUrl({
                          CDNUrl,
                          dir: 'logo',
                          uploadId: image.uploadId,
                          token: this.state.staticToken
                        })}
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
