import React from 'react'
import Logo from '../../src/Logo.native'

import { shallow } from 'enzyme'

it('renders correctly', () => {
  expect(shallow(<Logo />)).toMatchSnapshot()
})
