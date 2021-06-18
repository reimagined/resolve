import React, { useState, useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import { Container, Row, Col } from 'reactstrap'
import { useQuery } from '@resolve-js/react-hooks'
import FeedByAuthor from './FeedByAuthor'
import Loading from './Loading'
const BlogHeader = ({ userId }) => {
  const [user, setUser] = useState('unknown')
  const getUser = useQuery(
    {
      name: 'user-profiles',
      resolver: 'fullNameById',
      args: {
        userId,
      },
    },
    (err, result) => {
      if (err) {
        setUser(null)
        return
      }
      setUser({ fullName: result.data })
    }
  )
  useEffect(() => {
    getUser()
  }, [])
  return (
    <React.Fragment>
      <div className="text-muted">Personal blog</div>
      <p className="lead">{user.fullName}</p>
    </React.Fragment>
  )
}
const UserBlog = ({
  match: {
    params: { id: authorId },
  },
}) => {
  const [user, setUser] = useState('unknown')
  const getUser = useQuery(
    {
      name: 'user-profiles',
      resolver: 'profile',
      args: {},
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
    return <Loading />
  }
  if (user === null) {
    return <Redirect to={'/'} />
  }
  return (
    <React.Fragment>
      <Container>
        <Row
          style={{ display: 'flex', justifyContent: 'center' }}
          className="pt-3"
        >
          <Col xs={12} sm={8}>
            <BlogHeader userId={authorId} />
          </Col>
        </Row>
      </Container>
      <Container>
        <Row style={{ display: 'flex', justifyContent: 'center' }}>
          <Col xs={12} sm={8}>
            <FeedByAuthor authorId={authorId} user={user} />
          </Col>
        </Row>
      </Container>
    </React.Fragment>
  )
}
export default UserBlog
