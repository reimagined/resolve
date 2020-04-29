import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Redirect, Link } from 'react-router-dom'
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
  Spinner
} from 'reactstrap'
import { useStaticResolver, useQuery, useCommand } from 'resolve-react-hooks'
import { UserProfile } from '../../common/types'
import Loading from './Loading'

const UserInfo = (props: { user: UserProfile | string | null }): any => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  // const [deleted, setDeleted] = useState(false)
  const [state, setState] = useState({
    deleted: null,
    gatheringStarted: null
  })
  const { deleted, gatheringStarted } = state
  const { user } = props

  const deleteMe = useCommand(
    {
      type: 'delete',
      aggregateId: typeof user === 'object' && user !== null ? user.id : null,
      aggregateName: 'user-profile',
      payload: {}
    },
    (error, result) => {
      if (error == null) {
        setState({ ...state, deleted: true })
      }
    },
    [user]
  ) as () => void

  const gatherPersonalData = useCommand(
    {
      type: 'gatherPersonalData',
      aggregateId: typeof user === 'object' && user !== null ? user.id : null,
      aggregateName: 'user-profile',
      payload: {}
    },
    (error, result) => {
      if (error == null) {
        if (error == null) {
          setState({ ...state, gatheringStarted: true })
        }
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

  const { archive = null } = user
  const { id: archiveId } = archive || {}

  const archiveItem =
    gatheringStarted || archiveId === null ? (
      <DropdownItem disabled>Being gathered now...</DropdownItem>
    ) : (
      <DropdownItem>
        Download <span>#{archiveId}</span>
      </DropdownItem>
    )

  const archiveSubmenu = archive ? (
    <React.Fragment>
      <DropdownItem divider />
      <DropdownItem header>Archive</DropdownItem>
      {archiveItem}
    </React.Fragment>
  ) : null

  return (
    <React.Fragment>
      <UncontrolledDropdown nav inNavbar>
        <DropdownToggle nav caret>
          {user.nickname}
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem tag={Link} to="/profile">
            Update my profile
          </DropdownItem>
          <DropdownItem onClick={gatherPersonalData}>
            Gather my personal data
          </DropdownItem>
          <DropdownItem onClick={deleteMe}>Delete my profile</DropdownItem>
          {archiveSubmenu}
        </DropdownMenu>
      </UncontrolledDropdown>
    </React.Fragment>
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
        setUser({
          ...result.data.profile,
          id: result.data.id,
          archive: result.data.archive
        })
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
        <NavbarBrand href="/">
          <img src={asset('/resolve-logo.png') as string} alt="resolve-logo" />
        </NavbarBrand>
        <Nav navbar className="ml-auto">
          <NavItem>
            <NavLink tag={Link} to="/users">
              Users
            </NavLink>
          </NavItem>
          {typeof user === 'object' && user != null && (
            <NavItem>
              <NavLink tag={Link} to={`/blog/${user.id}`}>
                My blog
              </NavLink>
            </NavItem>
          )}
          <UserInfo user={user} />
        </Nav>
      </Navbar>
    </React.Fragment>
  )
}

export default Header
