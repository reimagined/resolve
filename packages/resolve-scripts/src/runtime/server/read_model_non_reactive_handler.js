import executeReadModelQuery from './execute_read_model_query'
import println from './utils/println'

const message = require('../../../configs/message.json')

const readModelNonReactiveHandler = async (req, res) => {
  const serialId = Date.now()

  try {
    console.log(req.jwtToken)

    const result = await executeReadModelQuery({
      jwtToken: req.jwtToken,
      modelName: req.params.modelName,
      resolverName: req.params.resolverName,
      resolverArgs: req.body.variables
    })

    res.status(200).send({
      serialId,
      result
    })
  } catch (err) {
    res.status(500).end(`${message.readModelFail}${err.message}`)
    println.error(err)
  }
}

export default readModelNonReactiveHandler
