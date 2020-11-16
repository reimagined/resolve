import React, { useState, useEffect } from 'react'

import { useQuery } from 'resolve-react-hooks'
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
    <div className="example-wrapper">
      <ShoppingLists  lists={lists ? lists.data || [] : []} />
    </div>
  )
}

export default MyLists