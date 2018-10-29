import { connectRootBasedUrls } from 'resolve-redux'

const NavLink = connectRootBasedUrls(['href'])('a')

export default NavLink
