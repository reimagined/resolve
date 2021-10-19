import React, { useState, useEffect } from 'react'

import { useQuery } from '@resolve-js/react-hooks'
import ShoppingLists from './ShoppingLists'

const MyLists = () => {
  const [lists, setLists] = useState({})

  const getLists = useQuery(
    { name: 'ShoppingLists', resolver: 'all', args: {} },
    (error, result) => {
      setLists(result)
    }
  )
  useEffect(() => {
    getLists()
  }, [])

  return (
    <div
      style={{
        maxWidth: '580px',
        margin: '0 auto',
        paddingLeft: '10px',
        paddingRight: '10px',
      }}
    >
      <ShoppingLists lists={lists ? lists.data || [] : []} />
    </div>
  )
}

export default MyLists
