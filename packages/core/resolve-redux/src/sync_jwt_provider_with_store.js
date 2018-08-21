import jwtDecode from 'jwt-decode'
import stableStringify from 'json-stable-stringify'
import { updateJwt } from './actions'

const syncJwtProviderWithStore = async (jwtProvider, store) => {
  if (jwtProvider) {
    const jwtToken = await jwtProvider.get()

    let jwt = store.getState().jwt
    try {
      jwt = jwtDecode(jwtToken)
    } catch (err) {}

    if (stableStringify(store.getState().jwt) !== stableStringify(jwt)) {
      store.dispatch(updateJwt(jwt))
    }
  }
}

export default syncJwtProviderWithStore
