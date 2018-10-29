import createAdapter from 'resolve-bus-base'
import publish from './publish'
import dispose from './dispose'

export default createAdapter.bind(
  null,
  async () => {},
  async () => {},
  publish,
  dispose
)
