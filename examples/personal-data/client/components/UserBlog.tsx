import React, { useState, useEffect } from 'react'
import { Redirect } from 'react-router-dom'
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
  Alert,
  Card,
  CardBody,
  CardTitle,
  CardText
} from 'reactstrap'
import { useCommand, useQuery } from 'resolve-react-hooks'

import { UserProfile } from '../../common/types'

type PostProps = {
  title: string
  content: string
}

const BlogHeader = ({ user }: { user: UserProfile }) => (
  <p className="lead">
    Blog {user.fullName} ({user.nickname})
  </p>
)

const NewPost = ({ user }: { user: UserProfile }) => {
  const [values, setValues] = useState({
    title: '',
    content: '',
    error: null,
    collapsed: true
  })
  const { title, content, collapsed, error } = values
  const publish = useCommand(
    {
      type: 'create',
      aggregateId: v4(),
      aggregateName: 'blog-post',
      payload: {
        authorId: user.id,
        content,
        title
      }
    },
    error => {
      if (error) {
        setValues({ ...values, error: true, collapsed: false })
      } else {
        setValues({
          ...values,
          error: false,
          title: '',
          content: '',
          collapsed: true
        })
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
            <Label for="addPostTitle">New post</Label>
            <Input id="addPostTitle" onChange={handleChange('title')} />
          </FormGroup>
          <FormGroup>
            <Input
              onChange={handleChange('content')}
              type="textarea"
              id="addPostContent"
            />
            <FormText>Use MD syntax</FormText>
          </FormGroup>
          <FormGroup>
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

const FeedByAuthor = ({ authorId }: { authorId: string }) => {
  const [posts, setPosts] = useState([])

  const getPosts = useQuery(
    { name: 'blog-posts', resolver: 'feedByAuthor', args: { authorId } },
    (error, result) => {
      setPosts(result.data)
    }
  )
  useEffect(() => {
    getPosts()
  }, [])
  return (
    <React.Fragment>
      {posts.map((p, idx) => (
        <Post key={idx} post={{ title: p.title, content: p.content }} />
      ))}
    </React.Fragment>
  )
}

const Post = ({ post }: { post: PostProps }) => {
  const { title, content } = post
  return (
    <div className="mb-3">
      <Card>
        <CardBody>
          <CardTitle>{title}</CardTitle>
          <CardText>{content}</CardText>
        </CardBody>
      </Card>
    </div>
  )
}

const UserBlog = ({
  match: {
    params: { id: authorId }
  }
}: {
  match: {
    params: {
      id: string
    }
  }
}): any => {
  const [user, setUser] = useState<UserProfile | string | null>('unknown')
  const getUser = useQuery(
    {
      name: 'user-profiles',
      resolver: 'profile',
      args: {}
    },
    (err, result) => {
      if (err) {
        setUser(null)
        return
      }
      setUser({ ...result.data.profile, id: result.data.id })
    }
  )
  useEffect(() => {
    getUser()
  }, [])

  if (typeof user === 'string') {
    return 'loading'
  }
  if (user === null) {
    return <Redirect to={'/'} />
  }

  return (
    <React.Fragment>
      <Container>
        <Row
          className="py-3"
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <Col xs={12} sm={8}>
            {/* TODO: <BlogHeader user={userWith id === authorId} /> */}
            <p className="lead">Blog of user: {authorId}</p>
            {authorId === user.id && <NewPost user={user} />}
          </Col>
        </Row>
      </Container>
      <Container>
        <Row
          className="py-3"
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <Col xs={12} sm={8}>
            <FeedByAuthor authorId={authorId} />
          </Col>
        </Row>
      </Container>
    </React.Fragment>
  )
}

export default UserBlog
