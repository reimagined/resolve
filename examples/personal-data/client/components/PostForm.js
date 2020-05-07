import React, { useState, useContext } from 'react'
import { FormGroup, Label, Input, Button, FormText } from 'reactstrap'
import { useCommand } from 'resolve-react-hooks'
import uuid from 'uuid/v4'

import UserContext from '../userContext'

import ImageUploader from './ImageUpload'

const PostForm = ({ successHandler, errorHandler }) => {
  const [values, setValues] = useState({
    title: '',
    content: ''
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
        title
      }
    },
    (error, result) => {
      if (error) {
        errorHandler(error)
      } else {
        setValues({
          ...values,
          title: '',
          content: ''
        })
        successHandler(result)
      }
    },
    [content]
  )

  const handleChange = prop => event => {
    setValues({ ...values, [prop]: event.target.value })
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
            <Button onClick={publish} className="mr-1">
              Publish
            </Button>
            <ImageUploader owner={user} />
          </div>
        </FormGroup>
      </div>
    </React.Fragment>
  )
}

export default PostForm
