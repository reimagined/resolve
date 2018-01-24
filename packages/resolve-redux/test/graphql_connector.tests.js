import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { expect } from 'chai'
import React from 'react'

import gqlConnector from '../src/graphql_connector'

Enzyme.configure({ adapter: new Adapter() })
global.fetch = Promise.resolve()

describe('graphql connector', () => {
  let originalFetch = global.fetch

  beforeAll(() => {
    global.fetch = (...args) => {}
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('should wrap component into graphql connector', () => {
    const WrappedComponent = gqlConnector('query { Test }')('div')
    const onClick = () => {}
    const { props } = mount(<WrappedComponent onClick={onClick} />)
      .find('div')
      .get(0)
    expect(props.onClick).to.be.equal(onClick)
    // eslint-disable-next-line no-unused-expressions
    expect(props.data).to.exist
  })
})
