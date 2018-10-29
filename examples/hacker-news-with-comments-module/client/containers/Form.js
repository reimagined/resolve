import { connectRootBasedUrls } from 'resolve-redux'

const Form = connectRootBasedUrls(['action'])('form')

export default Form
