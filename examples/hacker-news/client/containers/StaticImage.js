import { connectStaticBasedUrls } from '@resolve-js/redux'

const StaticImage = connectStaticBasedUrls(['src'])('img')

export { StaticImage }
