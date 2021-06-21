import { Image } from 'react-bootstrap'
import { connectStaticBasedUrls } from '@resolve-js/redux'
const StaticImage = connectStaticBasedUrls(['src'])(Image)
export { StaticImage }
