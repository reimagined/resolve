import React, { useContext } from 'react'

import { getClient } from 'resolve-client'

import { ResolveContext } from './context'

const useStatic = (assetPath: string | Array<string>): string | string[] => {
  const context = useContext(ResolveContext)
  if (!context) {
    throw Error('You cannot use resolve effects outside Resolve context')
  }
  const api = getClient(context)
  let result
  if (typeof assetPath === 'string') {
    result = api.getStaticAssetUrl(assetPath)
  } else {
    result = assetPath.map(path => api.getStaticAssetUrl(path))
  }
  return result
}

export { useStatic }
