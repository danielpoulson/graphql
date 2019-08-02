import { Cell } from './cell.model'
import { getShiftSeq } from '../../utils/helpers'
import { callLineData, loadMain } from '../../db/sql_data'

const mthOEE = [
  { line: 1, oeedata: [0, 0, 30.0, 38.9, 51.9, 41.3, 0, 0, 0, 0, 0, 0] },
  { line: 2, oeedata: [0, 0, 46.0, 40.1, 52.1, 46.5, 0, 0, 0, 0, 0, 0] },
  { line: 3, oeedata: [0, 0, 26.8, 27.1, 48.9, 55.3, 0, 0, 0, 0, 0, 0] },
  { line: 4, oeedata: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { line: 5, oeedata: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { line: 6, oeedata: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { line: 7, oeedata: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
]

const getCell = async (_, args, ctx) => {
  const shiftseq = getShiftSeq()
  const lineOEETrend = mthOEE.find(e => e.line === args.id)

  const payload = await callLineData(shiftseq, '201907%', args.id)
    .then(items => {
      return {
        day: items.day,
        month: items.month,
        oeeTrend: lineOEETrend,
        downPareto: items.downPareto
      }
    })
    .catch(err => console.log(err))

  return payload
}

const newCell = (_, args, ctx) => {
  return Cell.create({ ...args.input })
}

const getCells = (_, args, ctx) => {
  const shiftseq = getShiftSeq()

  return loadMain(shiftseq)
  // return data
}

const updateCell = (_, args, ctx) => {
  const update = args.input
  return Cell.findByIdAndUpdate(args.id, update, { new: true })
    .lean()
    .exec()
}

const removeCell = (_, args, ctx) => {
  return Cell.findByIdAndRemove(args.id)
    .lean()
    .exec()
}

export default {
  Query: {
    getCells,
    getCell
  },
  Mutation: {
    newCell,
    updateCell,
    removeCell
  }
}
