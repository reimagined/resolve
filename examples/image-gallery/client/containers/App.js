import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button, CardColumns, CardImg, Card, Form } from 'react-bootstrap'
import FileUploadProgress from 'react-fileupload-progress'
import { useQuery, useCommand } from '@resolve-js/react-hooks'
import {
  getCDNBasedUrl,
  getFormUpload,
  getToken,
} from '@resolve-js/module-uploader'

const App = ({ CDNUrl }) => {
  const [form, setForm] = useState({
    data: {
      url: 'http://localhost',
    },
    uploadId: '',
    isHidden: true,
  })
  const [staticToken, setStaticToken] = useState('')
  const [token, setToken] = useState('')
  const [fileName, setFileName] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [images, setImages] = useState([])
  const [mimeType, setMimeType] = useState('')

  const handleFileNameChange = useCallback(
    (event) => setFileName(event.target.value),
    [setFileName]
  )
  const handleGetUrl = useCallback(() => {
    getFormUpload({ dir: 'logo' }).then((result) =>
      setForm({
        data: result.form,
        uploadId: result.uploadId,
        isHidden: false,
      })
    )
    getToken({ dir: 'logo' }).then(setToken)
  }, [setForm])
  const formGetter = useCallback(
    () => new FormData(document.getElementById('customForm')),
    []
  )

  const getImages = useQuery(
    {
      name: 'Images',
      resolver: 'allImages',
      args: {},
    },
    (error, result) => {
      if (error == null) {
        setImages(result.data)
      }
    },
    [setImages]
  )

  const createImage = useCommand((uploadId, payload) => ({
    aggregateName: 'Image',
    type: 'createImage',
    aggregateId: uploadId,
    payload,
  }))

  const fileRef = useRef()

  useEffect(() => {
    getToken({ dir: 'logo' }).then(setStaticToken)
    getImages()
  }, [])

  const formRenderer = useCallback(
    (onSubmit) => {
      return (
        <Form id="customForm">
          {form.fields != null
            ? Object.keys(form.fields).map((key, index) => (
                <Form.Control
                  as="input"
                  key={index}
                  name={key}
                  value={form.fields[key]}
                  type="hidden"
                />
              ))
            : ''}
          <Form.Control
            as="input"
            type="hidden"
            name="Content-Type"
            value={mimeType}
          />
          <Form.Group>
            <Form.Label>File input</Form.Label>
            <Form.File name="file" id="input" ref={fileRef} />
          </Form.Group>
          <Form.Control
            as="input"
            placeholder="File name"
            onChange={handleFileNameChange}
          />
          <br />
          <Button
            outline="true"
            color="success"
            onClick={(...args) => {
              setMimeType(fileRef.current.files[0].type)
              onSubmit(...args)
            }}
          >
            Upload
          </Button>
        </Form>
      )
    },
    [form, setMimeType, fileRef, handleFileNameChange]
  )

  return (
    <div>
      <div style={{ padding: '10px' }}>
        <Button
          outline="true"
          color="primary"
          style={{ marginBottom: '10px' }}
          onClick={handleGetUrl}
        >
          Upload file
        </Button>

        <div hidden={form.isHidden}>
          <FileUploadProgress
            key="file"
            url={form.data.url}
            method="post"
            formRenderer={formRenderer}
            formGetter={formGetter}
            onLoad={() => {
              const name = fileName === '' ? 'Default name' : fileName
              createImage(form.uploadId, {
                name,
                uploadId: form.uploadId,
              })
              setIsLoaded(true)
            }}
          />

          <h2>
            {isLoaded ? (
              <a
                href={getCDNBasedUrl({
                  CDNUrl,
                  dir: 'logo',
                  uploadId: form.uploadId,
                  token,
                })}
              >
                {form.uploadId}
              </a>
            ) : (
              ''
            )}
          </h2>
        </div>
      </div>

      <CardColumns>
        {images != null
          ? images.map((image, index) => (
              <Card key={index}>
                <CardImg
                  width="300px"
                  src={getCDNBasedUrl({
                    CDNUrl,
                    dir: 'logo',
                    uploadId: image.uploadId,
                    token: staticToken,
                  })}
                />

                <Card.Body>
                  <Card.Title>{`${index + 1}: ${image.name}`}</Card.Title>
                </Card.Body>
              </Card>
            ))
          : ''}
      </CardColumns>
    </div>
  )
}

export { App }
