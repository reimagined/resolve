import { Image } from 'react-bootstrap'
import { connectStaticBasedUrls } from 'resolve-redux'

const StaticImage = connectStaticBasedUrls(['src'])(Image)

export { StaticImage }
