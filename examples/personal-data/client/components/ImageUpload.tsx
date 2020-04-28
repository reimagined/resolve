import React, { useState, useEffect, useCallback } from 'react'
import {
  Form,
  Input,
  Label,
  Button,
  FormGroup,
  CustomInput,
  FormText,
  FormFeedback
} from 'reactstrap'
import uuid from 'uuid/v4'
import FileUploadProgress from 'react-fileupload-progress'
import { useCommand, useCommandBuilder } from 'resolve-react-hooks'

import {
  getCDNBasedUrl,
  getFormUpload,
  getToken
} from 'resolve-module-uploader'

import UploaderContext from '../context'
import { UserProfile } from '../../common/types'

const DIRECTORY = 'images'

const ImageUploader = ({ owner }: { owner: UserProfile }) => {
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
    loaded: null,
    loadedId: null
  })

  const {
    form: { url, fields },
    uploadId,
    token,
    staticToken,
    mimeType,
    fileName,
    loaded,
    loadedId
  } = state

  useEffect(() => {
    getToken({ dir: DIRECTORY }).then(staticToken => {
      setState({ ...state, staticToken })
    })
  }, [])

  /*   const aggregateId = uuid()
  const uploadStarted = useCommand({
    type: 'startUpload',
    aggregateName: 'media',
    aggregateId, // TODO: what is here? uploadId?
    payload: {
      mediaId: aggregateId, // TODO: what is here? uploadId?
      owner: owner.fullName,
      ownerId: owner.id
    }
  }) */

  const uploadStarted = useCommandBuilder((aggregateId: string) => ({
    type: 'startUpload',
    aggregateName: 'media',
    aggregateId, // TODO: what is here? uploadId?
    payload: {
      mediaId: aggregateId, // TODO: what is here? uploadId?
      owner: owner.fullName,
      ownerId: owner.id
    }
  }))

  /*   const uploadFinished = useCommand({
    type: 'finishUpload',
    aggregateName: 'media',
    aggregateId, // TODO: what is here? uploadId?
    payload: {}
  }) */

  const uploadFinished = useCommandBuilder((aggregateId: string) => ({
    type: 'finishUpload',
    aggregateName: 'media',
    aggregateId, // TODO: what is here? uploadId?
    payload: {}
  }))

  const handleGetUrl = useCallback(() => {
    getFormUpload({ dir: DIRECTORY }).then(result => {
      const { form, uploadId } = result
      getToken({ dir: DIRECTORY }).then(token =>
        setState({ ...state, token, form, uploadId, loaded: false })
      )
    })
  }, [state])

  const ref = React.createRef<HTMLInputElement>()

  const uploadFormRender = onSubmitHandler => {
    return (
      <Form id="uploadForm">
        <FormGroup>
          <CustomInput type="file" name="file" id="fileUpload" innerRef={ref} />
        </FormGroup>

        <Input type="hidden" name="Content-Type" value={mimeType} />
        {Object.keys(fields).map((key, index) => (
          <Input key={index} name={key} value={fields[key]} type="hidden" />
        ))}

        <Button
          outline
          color="success"
          onClick={(...args) => {
            setState({ ...state, mimeType: ref.current.files[0].type })
            uploadStarted(uploadId)
            onSubmitHandler(...args)
          }}
        >
          Upload
        </Button>
      </Form>
    )
  }

  const formGetter = () => {
    const form = new FormData(document.querySelector('#uploadForm'))
    return form
  }

  const onLoad = () => {
    setState({ ...state, loaded: true, loadedId: uploadId, uploadId: null })
    uploadFinished(uploadId)
  }

  const handleFocus = event => event.target.select()

  return (
    <UploaderContext.Consumer>
      {({ CDNUrl }) => (
        <div>
          {uploadId == null && (
            <Button outline color="primary" onClick={handleGetUrl}>
              Upload file
            </Button>
          )}

          {uploadId != null && (
            <div>
              <FileUploadProgress
                key="file"
                url={`${url}&type=${encodeURIComponent(mimeType)}`}
                method="post"
                formRenderer={uploadFormRender}
                formGetter={formGetter}
                onLoad={onLoad}
              />
            </div>
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
      )}
    </UploaderContext.Consumer>
  )
}

export default ImageUploader
