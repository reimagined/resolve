import {
  HOT_MODULE_REPLACEMENT,
  UPDATE_JWT,
  LOGOUT,
  AUTH_REQUEST,
  AUTH_SUCCESS,
  AUTH_FAILURE
} from './action-types'

export const hotModuleReplacement = (hotModuleReplacementId: any) => ({
  type: HOT_MODULE_REPLACEMENT,
  hotModuleReplacementId
})

export const updateJwt = (jwt: any) => ({
  type: UPDATE_JWT,
  jwt
})

export const logout = () => ({
  type: LOGOUT
})

export const authRequest = (url: string, body: any = {}, method: string) => ({
  type: AUTH_REQUEST,
  url,
  body,
  method
})

export const authSuccess = (url: string, body: any, method: string) => ({
  type: AUTH_SUCCESS,
  url,
  body,
  method
})

export const authFailure = (
  url: string,
  body: any,
  method: string,
  error: Error
) => ({
  type: AUTH_FAILURE,
  url,
  body,
  method,
  error
})
