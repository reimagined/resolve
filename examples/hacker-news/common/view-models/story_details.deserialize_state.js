import Immutable from 'seamless-immutable'

export default state => Immutable(JSON.parse(state))
