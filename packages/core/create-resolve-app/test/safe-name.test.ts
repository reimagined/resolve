import safeName from '../src/safe-name'

test('safeName works correctly', () => {
  expect(safeName('dev')).toEqual('dev')
  expect(safeName(`V0.29.0`)).toEqual('V0.29.0')
  expect(safeName('93476e2c437df60a4c234af872fd3658732e919c')).toEqual(
    '93476e2c437df60a4c234af872fd3658732e919c'
  )
  expect(safeName(`with-@ampersand`)).toEqual('with-ampersand')
  expect(safeName(`string/with\\slashes`)).toEqual('string-with-slashes')
})
