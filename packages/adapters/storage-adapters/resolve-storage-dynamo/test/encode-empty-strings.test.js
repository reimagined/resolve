import encodeEmptyStrings from '../src/encode-empty-strings'

test('method "encodeEmptyStrings" should encode empty strings', async () => {
  const obj = {
    key1: 'text-value',
    key2: 100500,
    key3: ['text', 10, 20, null, {
      key1: 'text-value',
      key2: 100500,
      key3: ['text', 10, 20, null],
      key4: {
        key1: 500100,
        key2: 'text-value',
        key3: ['text', 10, 20, null]
      }
    }],
    key4: {
      key1: 500100,
      key2: 'text-value',
      key3: ['text', 10, 20, null],
      key4: {
        key1: 500100,
        key2: 'text-value',
        key3: ['text', 10, 20, null]
      }
    },
    key5: null
  }
  
  expect(encodeEmptyStrings(obj)).toMatchSnapshot()
})