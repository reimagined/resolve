import React from 'react'
import { Image as BootstrapImage } from 'react-bootstrap'
import { useStatic } from 'resolve-react-hooks'

const Image = ({ src, ...otherProps }) => <BootstrapImage {...otherProps} src={useStatic(src)} />

export default Image
