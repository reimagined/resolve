import { connectStaticBasedUrls } from 'resolve-redux'

const Image = connectStaticBasedUrls(['src'])('img')

export default Image
