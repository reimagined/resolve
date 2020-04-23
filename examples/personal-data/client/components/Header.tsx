import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Redirect, Link } from 'react-router-dom'
import {
  Navbar,
  NavbarBrand,
  Row,
  Col,
  Nav,
  NavItem,
  NavLink,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from 'reactstrap'
import { useStaticResolver, useQuery, useCommand } from 'resolve-react-hooks'
import { UserProfile } from '../../common/types'
import Loading from './Loading'

const UserInfo = (props: { user: UserProfile | string | null }): any => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const { user } = props

  const toggle = () => setDropdownOpen(prevState => !prevState)

  const deleteMe = useCommand(
    {
      type: 'delete',
      aggregateId: typeof user === 'object' && user !== null ? user.id : null,
      aggregateName: 'user-profile',
      payload: {}
    },
    (error, result) => {
      if (error == null) {
        setDeleted(true)
      }
    },
    [user]
  ) as () => void

  if (typeof user === 'string') {
    return <Loading />
  }

  if (user === null) {
    return null
  }

  if (deleted) {
    return <Redirect to="/" />
  }

  return (
    <Nav navbar>
      <NavItem>
        <NavLink tag={Link} to={`/blog/${user.id}`}>
          My blog
        </NavLink>
      </NavItem>
      <NavItem>
        <Dropdown isOpen={dropdownOpen} toggle={toggle}>
          <DropdownToggle outline caret>
            {user.nickname}
          </DropdownToggle>
          <DropdownMenu right>
            <DropdownItem tag={Link} to="/profile">Update my profile</DropdownItem>
            <DropdownItem onClick={deleteMe}>Delete my profile</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavItem>
    </Nav>
  )
}

const Header = () => {
  const asset = useStaticResolver()

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
      if (result.data !== null) {
        setUser({ ...result.data.profile, id: result.data.id })
      } else {
        setUser(null)
      }
    }
  )
  useEffect(() => {
    getUser()
  }, [])

  return (
    <React.Fragment>
      <Helmet>
        <title>Personal Blog Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href={asset('/bootstrap.min.css') as string} />
        <link rel="icon" href={asset('/favicon.ico') as string} />
      </Helmet>

      <Navbar color="light" light expand="md">
        <NavbarBrand className="mr-auto" href="/">
          <Row>
            <Col>
              <img
                src={asset('/resolve-logo.png') as string}
                alt="resolve-logo"
              />
            </Col>
          </Row>
        </NavbarBrand>
        <Nav navbar>
          <NavItem>
            <NavLink tag={Link} to="/users">
              Users
            </NavLink>
          </NavItem>
        </Nav>
        <UserInfo user={user} />
      </Navbar>
    </React.Fragment>
  )
}

export default Header
