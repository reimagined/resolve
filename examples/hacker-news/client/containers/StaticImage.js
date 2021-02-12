import { connectStaticBasedUrls } from '@reimagined/redux'

const StaticImage = connectStaticBasedUrls(['src'])('img')

export { StaticImage }
