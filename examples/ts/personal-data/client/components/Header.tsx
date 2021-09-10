import React, { useEffect, useState, useContext, useCallback } from 'react'
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
  Dropdown,
} from 'reactstrap'
import { getCDNBasedUrl } from '@resolve-js/module-uploader'
import {
  useStaticResolver,
  useQuery,
  useCommand,
} from '@resolve-js/react-hooks'

import Loading from './Loading'
import UploaderContext from '../context'

const UserInfo = (props: any) => {
  const [state, setState] = useState({
    deleted: null,
    gatheringStarted: null,
    open: false,
  })
  const { deleted, gatheringStarted, open } = state
  const { user } = props
  const toggle = () => {
    setState({ ...state, open: !open })
  }
  const uploaderContext = useContext(UploaderContext)
  const { CDNUrl } = uploaderContext

  const deleteMe = useCommand(
    {
      type: 'delete',
      aggregateId: typeof user === 'object' && user !== null ? user.id : null,
      aggregateName: 'user-profile',
      payload: {},
    },
    (error) => {
      if (error == null) {
        setState({ ...state, deleted: true })
      }
    },
    [user]
  )

  const deleteKeys = useCallback(() => {
    if (user && user.id) {
      fetch(`/api/personal-data-keys/${user.id}`, {
        method: 'DELETE',
      }).then(() => {
        setState({ ...state, deleted: true })
      })
    }
  }, [user])

  const gatherPersonalData = useCommand(
    {
      type: 'gatherPersonalData',
      aggregateId: typeof user === 'object' && user !== null ? user.id : null,
      aggregateName: 'user-profile',
      payload: {},
    },
    (error) => {
      if (error == null) {
        setState({ ...state, gatheringStarted: true, open: true })
      }
    },
    [user]
  )

  if (typeof user === 'string') {
    return <Loading />
  }

  if (user === null) {
    return null
  }

  if (deleted) {
    return <Redirect to="/#deleted" />
  }

  const { archive = null } = user
  const { id: uploadId, token, error } = archive || {}

  let archiveItem = null

  if (gatheringStarted) {
    archiveItem = <DropdownItem disabled>Being gathered now...</DropdownItem>
  } else if (error) {
    archiveItem = <DropdownItem disabled>Error occurred</DropdownItem>
  } else if (uploadId == null) {
    archiveItem = <DropdownItem disabled>Being gathered now...</DropdownItem>
  } else {
    archiveItem = (
      <DropdownItem
        href={getCDNBasedUrl({
          CDNUrl,
          dir: 'archives',
          uploadId,
          token,
        })}
      >
        Download
      </DropdownItem>
    )
  }

  const archiveSubmenu =
    archive || gatheringStarted ? (
      <React.Fragment>
        <DropdownItem divider />
        <DropdownItem header>Archive</DropdownItem>
        {archiveItem}
      </React.Fragment>
    ) : null

  return (
    <React.Fragment>
      <Dropdown isOpen={open} nav inNavbar toggle={toggle}>
        <DropdownToggle nav caret>
          {user.nickname}
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem tag={Link} to="/profile">
            Update my profile
          </DropdownItem>
          <DropdownItem onClick={() => gatherPersonalData()}>
            Gather my personal data
          </DropdownItem>
          <DropdownItem onClick={deleteKeys}>
            Delete my personal keys
          </DropdownItem>
          <DropdownItem onClick={() => deleteMe()}>
            Delete my profile
          </DropdownItem>
          {archiveSubmenu}
        </DropdownMenu>
      </Dropdown>
    </React.Fragment>
  )
}

const Header = () => {
  const asset = useStaticResolver()

  const [user, setUser] = useState(null)
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
      if (result.data !== null) {
        setUser({
          ...result.data.profile,
          id: result.data.id,
          archive: result.data.archive,
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
        <link rel="stylesheet" href={asset('/bootstrap.min.css')} />
        <link rel="icon" href={asset('/favicon.png')} />
      </Helmet>

      <Navbar color="light" light expand="md">
        <NavbarBrand href="/">
          <img src={asset('/resolve-logo.png')} alt="resolve-logo" />
        </NavbarBrand>
        <Nav navbar className="ml-auto">
          <NavItem>
            <NavLink tag={Link} to="/users">
              Users
            </NavLink>
          </NavItem>
          {user && (
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
