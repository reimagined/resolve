const sagasList = async (req, res) => {
  const statusPromises = [];
  for (const { name: eventSubscriber } of [
    ...req.resolve.schedulers,
    ...req.resolve.sagas,
  ]) {
    statusPromises.push(req.resolve.eventBus.status({ eventSubscriber }));
  }
  const statuses = await Promise.all(statusPromises);

  await res.json(statuses);
};

export default sagasList;
