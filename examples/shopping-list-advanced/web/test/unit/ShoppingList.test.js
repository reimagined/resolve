import React from 'react'
import { shallow } from 'enzyme'

import { ShoppingList } from '../../client/containers/ShoppingList'

test('renders correctly', () => {
  const data = {
    list: [
      {
        id: '1',
        checked: true,
        text: '1'
      },
      {
        id: '2',
        checked: false,
        text: '2'
      }
    ]
  }
  const jwt = { id: 'id' }
  const aggregateId = 'aggregateId'
  const toggleShoppingItem = () => {}
  const removeShoppingItem = () => {}

  const tree = shallow(
    <ShoppingList
      isLoading={false}
      data={data}
      jwt={jwt}
      aggregateId={aggregateId}
      toggleShoppingItem={toggleShoppingItem}
      removeShoppingItem={removeShoppingItem}
    />
  )
  expect(tree).toMatchSnapshot()
})
