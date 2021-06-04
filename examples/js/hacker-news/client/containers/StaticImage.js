import React from 'react'
import { useStaticResolver } from '@resolve-js/react-hooks'
const StaticImage = ({ src, ...props }) => {
  const asset = useStaticResolver()
  return React.createElement('img', { src: asset(src), ...props })
}
export { StaticImage }
