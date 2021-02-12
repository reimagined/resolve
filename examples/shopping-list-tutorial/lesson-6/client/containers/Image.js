import { Image as BootstrapImage } from 'react-bootstrap'
import { connectStaticBasedUrls } from '@reimagined/redux'

const Image = connectStaticBasedUrls(['src'])(BootstrapImage)

export default Image
