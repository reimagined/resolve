import React, { useState, useEffect } from 'react'
import { useQuery } from '@resolve-js/react-hooks'
import { Link } from 'react-router-dom'
import { Container, Row, Col } from 'reactstrap'

const User = ({ user }: { user: any }) => (
  <div className="mb-3">
    <Link to={`/blog/${user.id}`} className="lead">
      {user.profile.nickname}
    </Link>
    <div className="text-muted small">
      {user.profile.firstName} {user.profile.lastName}
    </div>
  </div>
)

const Users = () => {
  const [users, setUsers] = useState([])

  const getUsers = useQuery(
    { name: 'user-profiles', resolver: 'all', args: {} },
    (error, result) => {
      setUsers(result.data)
    }
  )
  useEffect(() => {
    getUsers()
  }, [])

  return (
    <React.Fragment>
      <Container>
        <Row
          className="py-3"
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <Col xs={12} sm={8}>
            <h4 className="mb-3">Registered users</h4>
            {users.map((user, idx) => (
              <User key={idx} user={user} />
            ))}
          </Col>
        </Row>
      </Container>
    </React.Fragment>
  )
}

export default Users
