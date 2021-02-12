import { Image } from 'react-bootstrap'
import { connectStaticBasedUrls } from '@reimagined/redux'

const StaticImage = connectStaticBasedUrls(['src'])(Image)

export { StaticImage }
