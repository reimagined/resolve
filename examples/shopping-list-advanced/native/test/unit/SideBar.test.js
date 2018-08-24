import React from 'react'
import { SideBar } from '../../containers/SideBar'

import { shallow } from 'enzyme'

it('renders correctly', () => {
  const navigation = {
    navigate: () => {}
  }

  expect(shallow(<SideBar navigation={navigation} />)).toMatchSnapshot()
})
