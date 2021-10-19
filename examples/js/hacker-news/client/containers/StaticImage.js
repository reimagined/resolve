import React from 'react'
import { useStaticResolver } from '@resolve-js/react-hooks'
const StaticImage = ({ src, ...props }) => {
  const asset = useStaticResolver()
  return <img src={asset(src)} {...props} alt="" />
}
export { StaticImage }
