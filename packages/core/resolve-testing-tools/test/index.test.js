import sinon from 'sinon'
import testingTools from '../src/index'

describe('resolve-testing-tools', () => {
  let sandbox
  
  beforeEach(()=>{
    sandbox = sinon.createSandbox()
    sandbox.stub(console, 'log')
  })
  
  afterEach(()=>{
    sandbox.restore()
  })
  
  test('should print "Hello world"', () => {
    testingTools()
    
    sinon.assert.calledWith(console.log, 'Hello world')
  })
})
