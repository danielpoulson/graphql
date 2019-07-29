import moment from 'moment'
export const getShiftSeq = () => {
  let dpToday = 0
  const dayofWeek = moment().weekday()

  if (dayofWeek <= 1) {
    if (dayofWeek === 1) {
      dpToday = moment().dayOfYear() - 3
    } else {
      dpToday = moment().dayOfYear() - 2
    }
  } else {
    dpToday = moment().dayOfYear() - 1
  }

  return moment()
    .dayOfYear(dpToday)
    .format()
    .toString()
    .replace(/-/g, '')
    .substring(0, 8)
}

export const timeConvert = n => {
  var hours = n / 60
  var rhours = Math.floor(hours)
  var minutes = (hours - rhours) * 60
  var rminutes =
    Math.round(minutes) < 10 ? `0${Math.round(minutes)}` : Math.round(minutes)
  return `${rhours}:${rminutes}`
}
