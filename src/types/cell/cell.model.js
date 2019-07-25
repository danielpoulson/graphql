import mongoose, { Schema } from 'mongoose'

const CellSchema = new Schema({
  machNo: { type: Number, require: true },
  downtime: { type: Number, require: true },
  runtime: { type: Number, require: true },
  downpc: { type: Number, require: true },
  units: { type: Number, require: true },
  avail: { type: Number, require: true },
  perf: { type: Number, require: true },
  oee: { type: Number, require: true },
  monthlyOEE: { type: Number, require: true },
  idle: { type: Number, require: true },
  unitsmin: { type: Number, require: true },
  downnone: { type: Number, require: true },
  date: { type: String, require: true }
})

export const Cell = mongoose.model('cell', CellSchema)
