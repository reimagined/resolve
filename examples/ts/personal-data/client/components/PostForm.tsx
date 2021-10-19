import React, { useState, useContext } from 'react'
import { FormGroup, Label, Input, Button, FormText } from 'reactstrap'
import { useCommand } from '@resolve-js/react-hooks'
import { v4 as uuid } from 'uuid'

import UserContext from '../userContext'

import ImageUploader from './ImageUpload'

type PostFormProps = { successHandler: Function; errorHandler: Function }

const PostForm = ({ successHandler, errorHandler }: PostFormProps) => {
  const [values, setValues] = useState({
    title: '',
    content: '',
  })
  const { title, content } = values
  const user = useContext(UserContext)

  const publish = useCommand(
    {
      type: 'create',
      aggregateId: uuid(),
      aggregateName: 'blog-post',
      payload: {
        authorId: user.id,
        content,
        title,
      },
    },
    (error, result, { aggregateId, payload }) => {
      if (error) {
        errorHandler(error)
      } else {
        setValues({
          ...values,
          title: '',
          content: '',
        })
        successHandler({ aggregateId, payload })
      }
    },
    [content]
  )

  const handleChange = (prop: string) => (event: any) => {
    setValues({ ...values, [prop]: event.target.value })
  }
  const textareaRef = React.createRef<any>()
  const onUploaded = (value: any) => {
    const textarea = textareaRef.current
    let nextContent = textarea.value
    if (textarea.selectionStart || textarea.selectionStart === '0') {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      nextContent =
        textarea.value.substring(0, start) +
        value +
        textarea.value.substring(end, textarea.value.length)
    } else {
      nextContent += value
    }
    textarea.value = nextContent
    setValues({ ...values, content: nextContent })
  }

  return (
    <React.Fragment>
      <div>
        <FormGroup>
          <Label for="addPostTitle">New post</Label>
          <Input id="addPostTitle" onChange={handleChange('title')} />
        </FormGroup>
        <FormGroup>
          <Input
            innerRef={textareaRef}
            onChange={handleChange('content')}
            type="textarea"
            id="addPostContent"
            rows="7"
          />
          <FormText>Use MD syntax</FormText>
        </FormGroup>
        <FormGroup>
          <div
            className="mt-3"
            style={{ display: 'flex', alignItems: 'flex-start' }}
          >
            <Button onClick={() => publish()} className="mr-1">
              Publish
            </Button>
            <ImageUploader owner={user} onUploaded={onUploaded} />
          </div>
        </FormGroup>
      </div>
    </React.Fragment>
  )
}

export default PostForm
