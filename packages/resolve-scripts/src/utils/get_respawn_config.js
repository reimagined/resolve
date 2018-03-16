export default function getRespawnConfig(path, debug) {
  if (debug) {
    return ['node', '--inspect', path]
  } else {
    return ['node', path]
  }
}
