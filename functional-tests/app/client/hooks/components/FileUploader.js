import React, { useState, useCallback, useContext } from 'react'
import { Form, Input, Button, FormGroup, CustomInput } from 'reactstrap'
import FileUploadProgress from 'react-fileupload-progress'
import {
  getCDNBasedUrl,
  getFormUpload,
  getToken,
} from '@resolve-js/module-uploader'

import UploaderContext from '../context'
import { v4 as uuid } from 'uuid'

const DIRECTORY = 'images'

const FileUploader = () => {
  const [state, setState] = useState({
    form: {
      fields: {},
      url: '',
    },
    uploadId: null,
    token: '',
    mimeType: '',
    fileName: '',
    picked: false,
    loaded: null,
  })

  const {
    form: { url, fields },
    uploadId,
    token,
    mimeType,
    loaded,
    picked,
  } = state

  const uploaderContext = useContext(UploaderContext)
  const { CDNUrl } = uploaderContext

  const handleGetUrl = useCallback(() => {
    getFormUpload({ dir: DIRECTORY }).then((result) => {
      const { form, uploadId } = result
      getToken({ dir: DIRECTORY }).then((token) =>
        setState({
          ...state,
          token,
          form,
          uploadId,
          aggregateId: uuid(),
          loaded: false,
        })
      )
    })
  }, [state])

  const handlePickFile = () => {
    setState({ ...state, picked: true })
  }

  const inputRef = React.createRef()

  const uploadFormRender = (onSubmitHandler) => (
    <Form id="uploadForm">
      {Object.keys(fields).map((key, index) => (
        <Input key={index} name={key} value={fields[key]} type="hidden" />
      ))}
      <Input type="hidden" name="Content-Type" value={mimeType} />
      <FormGroup style={{ display: 'flex' }}>
        <CustomInput
          onChange={handlePickFile}
          type="file"
          name="file"
          id="fileUpload"
          innerRef={inputRef}
        />
        <Button
          className="ml-1"
          outline={!picked}
          color={picked ? 'success' : ''}
          disabled={!picked}
          onClick={(...args) => {
            setState({
              ...state,
              mimeType: inputRef.current.files[0].type,
              picked: false,
            })
            onSubmitHandler(...args)
          }}
        >
          Upload
        </Button>
      </FormGroup>
    </Form>
  )

  const formGetter = () => {
    const form = new FormData(document.querySelector('#uploadForm'))
    return form
  }

  const onLoad = useCallback(() => {
    setState({
      ...state,
      loaded: true,
      uploadId,
    })
  }, [uploadId])

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignContent: 'flex-start',
          alignItems: 'flex-start',
        }}
      >
        {uploadId == null && (
          <FormGroup>
            <Button
              className="mr-1"
              outline
              color="primary"
              onClick={handleGetUrl}
            >
              Upload image
            </Button>
          </FormGroup>
        )}
      </div>
      {uploadId != null && (
        <div>
          <FileUploadProgress
            key="file"
            url={url}
            method="post"
            formRenderer={uploadFormRender}
            formGetter={formGetter}
            onLoad={onLoad}
          />
        </div>
      )}
      {loaded && uploadId != null && (
        <Button
          href={getCDNBasedUrl({
            CDNUrl,
            dir: DIRECTORY,
            uploadId: uploadId,
            token,
          })}
          color="info"
        >
          Get upload
        </Button>
      )}
    </div>
  )
}

export { FileUploader }
