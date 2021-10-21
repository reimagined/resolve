import * as React from 'react'
import { createWaitForResponseMiddleware } from '@resolve-js/client'
import { useQuery } from '@resolve-js/react-hooks'
import { useEffect, useState } from 'react'
import { Redirect } from 'react-router-dom'
import { Location } from 'history'

import Login from './Login'
import Loading from './Loading'

const ContentSelector = ({ user }: { user: any }) => {
  if (typeof user === 'string') {
    return <Loading />
  }

  if (user === null) {
    return <Login />
  }

  return <Redirect to={`/blog/${user.id}`} />
}

type HomeProps = { location: Location }

const Home = ({ location: { hash } }: HomeProps) => {
  const [user, setUser] = useState('unknown')
  const getUser = useQuery(
    {
      name: 'user-profiles',
      resolver: 'profile',
      args: {},
    },
    {
      middleware: {
        response: createWaitForResponseMiddleware({
          validator: async (response, confirm) => {
            const result = await response.json()
            if (result != null) {
              confirm(result)
            }
          },
          period: 1000,
          attempts: 5,
        }),
      },
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
    if (hash === '#deleted') {
      setUser(null)
    } else {
      getUser()
    }
  }, [])

  return (
    <React.Fragment>
      <ContentSelector user={user} />
    </React.Fragment>
  )
}

export default Home
