const logoutSaga = function*({ jwtProvider }) {
  yield jwtProvider.set('')
}

export default logoutSaga
