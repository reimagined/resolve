import fs from 'fs'
import path from 'path'
import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

Enzyme.configure({ adapter: new Adapter() })

if (!fs.existsSync(path.resolve(__dirname, 'native-chunk.js'))) {
  fs.copyFileSync(
    path.resolve(__dirname, 'test/__mocks__/native-chunk.js'),
    path.resolve(__dirname, 'native-chunk.js')
  )
}
