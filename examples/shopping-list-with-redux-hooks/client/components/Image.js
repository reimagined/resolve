import React from 'react'
import { Image as BootstrapImage } from 'react-bootstrap'
import { useStaticResolver } from 'resolve-react-hooks'

const Image = ({ src, ...otherProps }) => {
  const resolveStatic = useStaticResolver()
  return <BootstrapImage {...otherProps} src={resolveStatic(src)} />
}

export default Image
