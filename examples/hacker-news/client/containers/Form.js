import { connectRootBasedUrls } from '@reimagined/redux'

const Form = connectRootBasedUrls(['action'])('form')

export default Form
