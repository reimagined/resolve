const logoutSaga = function*({
  jwtProvider
}: {
  type: string
  jwtProvider: any
}) {
  yield jwtProvider.set('')
}

export default logoutSaga
