import React, { useState, useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import { Container, Row, Col } from 'reactstrap'
import { useQuery } from 'resolve-react-hooks'

import { UserProfile } from '../../common/types'

import FeedByAuthor from './FeedByAuthor'

import Loading from './Loading'

const BlogHeader = ({ user }: { user: UserProfile }) => (
  <p className="lead">
    Blog {user.fullName} ({user.nickname})
  </p>
)

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
            {/* TODO: <BlogHeader user={userWith id === authorId} /> */}
            <p className="lead">Blog of user: {authorId}</p>
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
