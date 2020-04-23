import React, { useState, useEffect } from 'react'
import { useQuery } from 'resolve-react-hooks'
import { Link } from 'react-router-dom'
import { Container, Row, Col } from 'reactstrap'

const User = ({ user }) => (
  <div className="mb-1">
    <Link to={`/blog/${user.id}`}>{user.profile.fullName}</Link>
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
            <h4>Registered users</h4>
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
