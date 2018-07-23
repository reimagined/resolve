import { Form as BootstrapForm } from 'react-bootstrap'
import { connectRootBasedUrls } from 'resolve-redux'

const Form = connectRootBasedUrls(['action'])(BootstrapForm)

export default Form
