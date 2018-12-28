import React from 'react'
import renderer from 'react-test-renderer'

import { ShoppingList } from '../../client/containers/ShoppingList'

test('renders correctly', () => {
  const tree = renderer
    .create(
      <ShoppingList
        toggleShoppingItem={() => {}}
        data={{
          list: [
            {
              id: 'id',
              text: 'text'
            }
          ]
        }}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
