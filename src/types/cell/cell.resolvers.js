import { Cell } from './cell.model'
import { getShiftSeq } from '../../utils/helpers'
import { loadMain } from '../../db/sql_data'

const getCell = (_, args, ctx) => {
  return Cell.findById(args.id)
    .lean()
    .exec()
}

const newCell = (_, args, ctx) => {
  console.log({ ...args.input })
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
