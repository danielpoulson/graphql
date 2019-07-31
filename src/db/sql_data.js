import { ConnectionPool } from 'mssql'
import { timeConvert, toOnePlace } from '../utils/helpers'

const config = {
  user: 'deltapp',
  password: 'pa$$w0rd',
  server: '10.0.10.12',
  database: 'MATTEC_PROHELP'
}

const createDayData = (r, down, shiftseq) => {
  let rtd

  rtd = {
    machno: 1,
    runtime: '',
    downtime: '',
    downpc: 0,
    units: 0,
    avail: 0,
    perf: 0,
    oee: 0,
    idle: 0,
    unitsmin: 0,
    shiftseq: '',
    downnone: 0
  }
  const dnTotal = down.Total / 60
  const runtime = r.RunTime
  const downtime = r.DownTime

  rtd.shiftseq = shiftseq
  rtd.machno = r.MachNo
  rtd.runtime = timeConvert(runtime)
  rtd.downtime = timeConvert(downtime)
  rtd.downpc = toOnePlace((downtime / r.TotalTime) * 100)
  rtd.units = r.Total

  if (r.Total > 0) {
    rtd.avail = toOnePlace((1 - downtime / r.TotalTime) * 100)
    rtd.perf = toOnePlace((r.Total / r.Target) * 100)
    rtd.oee = ((rtd.avail * rtd.perf) / 100).toFixed(1)
  }
  rtd.idle = 480 - (runtime + downtime)
  rtd.unitsmin = toOnePlace(r.Total / (runtime + downtime))
  rtd.downnone = toOnePlace((dnTotal / downtime) * 100)

  return rtd
}

export const loadMain = async shiftseq => {
  const query1 = `SELECT [MachNo]
     , SUM(((([TotTime]-[DownTime])/60) * [ExpCycTm])) As Target
     , SUM([CalProdQty]) As Total
     , SUM([TotTime] / 60) As TotalTime
     , SUM((TotTime - DownTime) / 60) As RunTime
     , SUM([DownTime] / 60) As DownTime
     , SUM([NumDownTm]) AS DownFreq
     FROM [MATTEC_PROHELP].[dbo].[vReportShift]
     WHERE ShiftSeq like '${shiftseq}%' AND JobSeq is not NULL
     GROUP By MachNo`

  const query2 = `SELECT [MachNo]
  ,SUM([Qty]) Total
  ,SUM([NumOccur]) Occur
  FROM [MATTEC_PROHELP].[dbo].[ShiftDown]
  WHERE ShiftSeq like '${shiftseq}%' AND DownNo = '1'
  Group By MachNo`

  try {
    // make sure that any items are correctly URL encoded in the connection string
    const pool = new ConnectionPool(config)
    await pool.connect()
    const results = await pool.request().query(query1)

    const down = await pool.request().query(query2)

    const data = results.recordset.map((rs, i) => {
      return createDayData(rs, down.recordset[i], shiftseq)
    })

    pool.close()
    return data
  } catch (err) {
    console.error(err)
  }
}
