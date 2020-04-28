import React, { useState } from 'react'
import { FormGroup, Label, Input, Button, FormText } from 'reactstrap'
import { useCommand } from 'resolve-react-hooks'
import uuid from 'uuid/v4'

import { UserProfile } from '../../common/types'
import ImageUploader from './ImageUpload'

const PostForm = ({
  owner,
  successHandler,
  errorHandler
}: {
  owner: UserProfile
  successHandler: (arg: any) => void
  errorHandler: (error: Error | null) => void
}) => {
  const [values, setValues] = useState({
    title: '',
    content: ''
  })
  const { title, content } = values

  const publish = useCommand(
    {
      type: 'create',
      aggregateId: uuid(),
      aggregateName: 'blog-post',
      payload: {
        authorId: owner.id,
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
  ) as () => void

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
            <ImageUploader owner={owner} />
          </div>
        </FormGroup>
      </div>
    </React.Fragment>
  )
}

export default PostForm
