const readModelList = async (req, res) => {
  const statusPromises = [];
  for (const { name: eventSubscriber } of req.resolve.readModels) {
    statusPromises.push(req.resolve.eventBus.status({ eventSubscriber }));
  }
  const statuses = await Promise.all(statusPromises);

  await res.json(statuses);
};

export default readModelList;
