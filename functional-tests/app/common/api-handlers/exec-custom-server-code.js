const execCustomServerCode = async (req, res) => {
  const result = await req.resolve.serverImports.customServerCode()

  res.json(result)
}

export default execCustomServerCode
