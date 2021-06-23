import React, { useState, useEffect } from 'react'
import { useQuery } from '@resolve-js/react-hooks'
import { Redirect } from 'react-router-dom'
import ProfileWithViewModel from './ProfileWithViewModel'
import Loading from './Loading'

const Profile = () => {
  const [userId, setUserId] = useState('unknown')

  const getUserId = useQuery(
    {
      name: 'user-profiles',
      resolver: 'profile',
      args: {},
    },
    (err, result) => {
      if (err) {
        setUserId(null)
        return
      }
      setUserId(result.data.id)
    },
    [userId]
  )

  useEffect(() => {
    getUserId()
  }, [])

  if (userId === 'unknown') {
    return <Loading />
  }

  if (userId === null) {
    return <Redirect to="/" />
  }

  return (
    <React.Fragment>
      <ProfileWithViewModel userId={userId} />
    </React.Fragment>
  )
}

export default Profile
