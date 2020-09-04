import { Image as BootstrapImage } from 'react-bootstrap'
import { connectStaticBasedUrls } from 'resolve-redux'

const Image = connectStaticBasedUrls(['src'])(BootstrapImage)

export default Image
