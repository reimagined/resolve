import { connectStaticBasedUrls } from 'resolve-redux'

const StaticImage = connectStaticBasedUrls(['src'])('img')

export { StaticImage }
