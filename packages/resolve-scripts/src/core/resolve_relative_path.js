import { relative } from 'path'

const resolveRelativePath = path => {
  return './' + relative(process.cwd(), path)
}

export default resolveRelativePath
