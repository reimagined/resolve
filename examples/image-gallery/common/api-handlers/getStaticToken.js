const getStaticToken = async (req, res) => {
  const adapter = req.resolve.uploader;
  try {
    const token = await adapter.createToken({
      dir: 'logo',
      expireTime: 10000000,
    });

    res.end(token);
  } catch (error) {
    await res.status(405);
    await res.end(error);
  }
};

export default getStaticToken;
