const getImages = async (store, { first, offset }) => {
  const skip = first || 0
  const images = await store.find(
    'Images',
    {},
    null,
    { createdAt: -1 },
    skip,
    skip + offset
  )
  return Array.isArray(images) ? images : []
}

export default {
  allImages: getImages
}
