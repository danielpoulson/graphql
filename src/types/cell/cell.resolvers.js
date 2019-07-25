import { Cell } from './cell.model'

const cell = (_, args, ctx) => {
  return Cell.findById(args.id)
    .lean()
    .exec()
}

const newCell = (_, args, ctx) => {
  return Cell.create({ ...args.input })
}

const cells = (_, args, ctx) => {
  return Cell.find({})
    .lean()
    .exec()
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
    cells,
    cell
  },
  Mutation: {
    newCell,
    updateCell,
    removeCell
  }
}
