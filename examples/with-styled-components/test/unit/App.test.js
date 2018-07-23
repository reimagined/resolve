import React from 'react'
import renderer from 'react-test-renderer'

import { StyledComponents } from '../../client/containers/StyledComponents'

test('renders correctly', () => {
  const tree = renderer.create(<StyledComponents />).toJSON()
  expect(tree).toMatchSnapshot()
})
