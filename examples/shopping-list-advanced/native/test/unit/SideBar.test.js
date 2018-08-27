import React from 'react'
import { SideBar } from '../../containers/SideBar'

import { shallow } from 'enzyme'

it('renders correctly', () => {
  const navigation = {
    navigate: () => {}
  }

  const jwt = { id: 'id' }

  expect(
    shallow(<SideBar navigation={navigation} jwt={jwt} />)
  ).toMatchSnapshot()
})
