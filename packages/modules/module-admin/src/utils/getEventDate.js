import dateFormat from 'dateformat'

const getEventDate = (event) => {
  let date = 'N\\A'
  try {
    date = dateFormat(new Date(event.timestamp), 'm/d/yy HH:MM:ss')
  } catch {}

  return date
}

export default getEventDate
