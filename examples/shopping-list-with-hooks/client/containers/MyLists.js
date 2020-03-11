import React, { useState } from 'react'

import { useQuery } from 'resolve-react-hooks'
import ShoppingLists from '../components/ShoppingLists'
import ShoppingListCreator from '../components/ShoppingListCreator'

const MyLists = () => {
  const [lists, setLists] = useState([])

  useQuery({ name: 'ShoppingLists', resolver: 'all', args: {} }, (error, result) => {
    setLists(result)
  })

  return (
    <div className="example-wrapper">
      My lists
      <ShoppingLists
        lists={lists ? lists.data || [] : []}
        onRemoveSuccess={result => {
          setLists({ ...lists, data: lists.data.filter(list => list.id !== result.aggregateId) })
        }}
      />
      <ShoppingListCreator
        lists={lists ? lists.data || [] : []}
        onCreateSuccess={result => {
          const nextLists = { ...lists }
          nextLists.data.push({
            name: result.payload.name,
            createdAt: result.timestamp,
            id: result.aggregateId
          })
          setLists(nextLists)
        }}
      />
    </div>
  )
}

export default MyLists
