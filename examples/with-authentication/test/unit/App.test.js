import React from 'react'
import renderer from 'react-test-renderer'

import { Authentication } from '../../client/containers/Authentication'

test('renders correctly', () => {
  const tree = renderer
    .create(
      <Authentication
        me={{
          name: 'Test'
        }}
      />
    )
    .toJSON()
  expect(tree).toMatchSnapshot()
})
