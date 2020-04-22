import React, { useState } from 'react'
import v4 from 'uuid/v4'
import {
  Container,
  Row,
  Col,
  FormGroup,
  Label,
  Form,
  Input,
  Button,
  FormText,
  Alert
} from 'reactstrap'
import { useCommand } from 'resolve-react-hooks'

import { UserProfile } from '../common/types'

type BlogProps = {
  user: UserProfile
}

const BlogHeader = ({ user }: { user: UserProfile }) => (
  <p className="lead">{user.fullName}</p>
)

const AddBlogpost = ({ user }: { user: UserProfile }) => {
  const [values, setValues] = useState({
    content: '',
    error: null,
    collapsed: true
  })
  const { content, collapsed, error } = values
  const publish = useCommand(
    {
      type: 'create',
      aggregateId: v4(),
      aggregateName: 'blog-post',
      payload: {
        authorId: user.id,
        content
      }
    },
    error => {
      if (error) {
        setValues({ ...values, error: true, collapsed: false })
      } else {
        setValues({ ...values, error: false, content: '', collapsed: true })
      }
    },
    [content]
  ) as () => void

  const handleChange = prop => event => {
    setValues({ ...values, error: false, [prop]: event.target.value })
  }

  const toggleCollapsed = () => {
    setValues({ ...values, collapsed: !collapsed })
  }

  return (
    <React.Fragment>
      {collapsed ? (
        <Button onClick={toggleCollapsed}> Publish new post</Button>
      ) : (
        <Form>
          <FormGroup>
            <Label for="addPostContent">New post</Label>
            <Input
              onChange={handleChange('content')}
              type="textarea"
              name="addPostContent"
              id="addPostContent"
            />
            <FormText>Use MD syntax</FormText>
            <Button onClick={publish} className="mt-3">
              Publish
            </Button>
          </FormGroup>
        </Form>
      )}
      {error && (
        <Alert color="danger">Ann error occurred while publishing</Alert>
      )}
    </React.Fragment>
  )
}

const UserBlog = (props: BlogProps): any => {
  const { user } = props
  // TODO: check if current user is owner of the blog then render <AddBlogpost />
  return (
    <React.Fragment>
      <Container>
        <Row
          className="py-3"
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <Col xs={12} sm={8}>
            <BlogHeader user={user} />
            <AddBlogpost user={user} />
          </Col>
        </Row>
      </Container>
    </React.Fragment>
  )
}

export default UserBlog
