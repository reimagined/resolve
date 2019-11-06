import zeromqDefault, * as zeromqWildcard from 'zeromq/v5-compat'
export default {
  default: zeromqDefault,
  ...zeromqWildcard
}
