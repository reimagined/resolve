import React, { useState, useEffect, useCallback } from 'react'
import {
  Form,
  Input,
  Button,
  FormGroup,
  CustomInput,
  FormFeedback
} from 'reactstrap'
import uuid from 'uuid/v4'
import FileUploadProgress from 'react-fileupload-progress'
import { useCommandBuilder } from 'resolve-react-hooks'

import {
  getCDNBasedUrl,
  getFormUpload,
  getToken
} from 'resolve-module-uploader'

import UploaderContext from '../context'

const DIRECTORY = 'images'

const ImageUploader = ({ owner }) => {
  const [state, setState] = useState({
    form: {
      fields: {},
      url: ''
    },
    uploadId: null,
    token: '',
    staticToken: '',
    mimeType: '',
    fileName: '',
    picked: false,
    loaded: null,
    loadedId: null,
    aggregateId: null
  })

  const {
    form: { url, fields },
    uploadId,
    token,
    // staticToken,
    mimeType,
    // fileName,
    loaded,
    loadedId,
    picked,
    aggregateId
  } = state

  useEffect(() => {
    getToken({ dir: DIRECTORY }).then(staticToken => {
      setState({ ...state, staticToken })
    })
  }, [])

  const uploadStarted = useCommandBuilder(
    aggregateId => ({
      type: 'startUpload',
      aggregateName: 'media',
      aggregateId,
      payload: {
        mediaId: uploadId,
        owner: owner.fullName,
        ownerId: owner.id
      }
    }),
    [uploadId]
  )

  const uploadFinished = useCommandBuilder(aggregateId => ({
    type: 'finishUpload',
    aggregateName: 'media',
    aggregateId,
    payload: {}
  }))

  const uploadError = useCommandBuilder(({ aggregateId, error }) => ({
    type: 'finishUpload',
    aggregateName: 'media',
    aggregateId,
    payload: {
      error
    }
  }))

  const handleGetUrl = useCallback(() => {
    getFormUpload({ dir: DIRECTORY }).then(result => {
      const { form, uploadId } = result
      getToken({ dir: DIRECTORY }).then(token =>
        setState({
          ...state,
          token,
          form,
          uploadId,
          aggregateId: uuid(),
          loaded: false
        })
      )
    })
  }, [state])

  const handlePickFile = () => {
    setState({ ...state, picked: true })
  }

  const ref = React.createRef()

  const uploadFormRender = onSubmitHandler => {
    return (
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
            innerRef={ref}
          />
          <Button
            className="ml-1"
            outline={!picked}
            color={picked ? 'success' : ''}
            disabled={!picked}
            onClick={(...args) => {
              setState({
                ...state,
                mimeType: ref.current.files[0].type,
                picked: false
              })
              uploadStarted(aggregateId)
              onSubmitHandler(...args)
            }}
          >
            Upload
          </Button>
        </FormGroup>
      </Form>
    )
  }

  const formGetter = () => {
    const form = new FormData(document.querySelector('#uploadForm'))
    return form
  }

  const onLoad = () => {
    setState({ ...state, loaded: true, loadedId: uploadId, uploadId: null })
    uploadFinished(aggregateId)
  }

  const onError = error => {
    uploadError({ aggregateId, error })
  }

  const handleFocus = event => event.target.select()

  return (
    <UploaderContext.Consumer>
      {({ CDNUrl }) => (
        <div>
          <div
            style={{
              display: 'flex',
              alignContent: 'flex-start',
              alignItems: 'flex-start'
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
            {loaded && loadedId && (
              <FormGroup>
                <Input
                  valid
                  type="text"
                  defaultValue={`![](${getCDNBasedUrl({
                    CDNUrl,
                    dir: DIRECTORY,
                    uploadId: loadedId,
                    token
                  })})`}
                  onFocus={handleFocus}
                />
                <FormFeedback valid>
                  File uploaded. Use the code above to embed uploaded image
                </FormFeedback>
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
                onError={onError}
              />
            </div>
          )}
        </div>
      )}
    </UploaderContext.Consumer>
  )
}

export default ImageUploader
