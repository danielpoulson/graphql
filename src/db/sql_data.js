import { ConnectionPool } from 'mssql'
import { timeConvert, toOnePlace } from '../utils/helpers'
import { transformDocument } from 'graphql-codegen-core'

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

  let dnTotal = 0

  if (down) {
    dnTotal = down.Total === null ? 0 : down.Total / 60
  }

  const runtime = r.RunTime
  const downtime = r.DownTime

  rtd.shiftseq = shiftseq
  rtd.machno = r.MachNo
  rtd.runtime = timeConvert(runtime)
  rtd.downtime = timeConvert(downtime)
  rtd.downpc = toOnePlace((downtime / r.TotalTime) * 100)
  rtd.units = r.Total

  console.log(r.Total, r.Target)

  if (downtime > 0 && r.TotalTime > 0) {
    rtd.avail = toOnePlace((1 - downtime / r.TotalTime) * 100)
  } else {
    rtd.avail = 0
  }

  if (r.Total > 0 && r.Target > 0) {
    rtd.perf = toOnePlace((r.Total / r.Target) * 100)
  } else {
    rtd.perf = 0
  }

  if (rtd.perf > 0 && rtd.avail > 0) {
    rtd.oee = ((rtd.avail * rtd.perf) / 100).toFixed(1)
  } else {
    rtd.oee = 0
  }

  rtd.idle = 480 - (runtime + downtime)
  rtd.unitsmin = toOnePlace(r.Total / (runtime + downtime))
  rtd.downnone = toOnePlace((dnTotal / downtime) * 100)

  return rtd
}

const createMonthData = r => {
  let rtd = {
    oee: 0
  }

  rtd.machno = r.MachNo
  // const runtime = Math.round((r.TotalTime - r.DownTime) / 60)
  // const downtime = Math.round(r.DownTime / 60)
  // rtd.downpc = toOnePlace((r.DownTime / r.TotalTime) * 100)
  // rtd.units = r.Total

  if (r.Total > 0) {
    const avail = (1 - r.DownTime / r.TotalTime) * 100
    const perf = (r.Total / r.Target) * 100
    rtd.oee = toOnePlace((avail * perf) / 100)
  }

  return rtd
}

// const createMonthData_old = r => {
//   let rtd = {
//     machno: 1,
//     runtime: 0,
//     downtime: 0,
//     downpc: 0,
//     units: 0,
//     avail: 0,
//     perf: 0,
//     oee: 0,
//     idle: 0,
//     unitsmin: 0
//   }

//   rtd.machno = r.MachNo
//   rtd.runtime = Math.round((r.TotalTime - r.DownTime) / 60)
//   rtd.downtime = Math.round(r.DownTime / 60)
//   rtd.downpc = toOnePlace((r.DownTime / r.TotalTime) * 100)
//   rtd.units = r.Total

//   if (r.Total > 0) {
//     rtd.avail = toOnePlace((1 - r.DownTime / r.TotalTime) * 100)
//     rtd.perf = toOnePlace((r.Total / r.Target) * 100)
//     rtd.oee = toOnePlace((rtd.avail * rtd.perf) / 100)
//   }
//   rtd.idle = 480 - (rtd.runtime + rtd.downtime)
//   rtd.unitsmin = toOnePlace(r.Total / (rtd.runtime + rtd.downtime))
//   return rtd
// }

const createDownPareto = (rs, total) => {
  const labels = []
  const values = []
  const pareto = []
  let cnt = 0
  rs.recordset.forEach((r, i) => {
    if (i <= 8) {
      const val = +((r.total / total) * 100).toFixed(1)
      cnt = cnt + +val
      labels.push(r.DownCode.trim())
      values.push(val)
      pareto.push(+cnt.toFixed(1))
    }
  })

  return { labels, values, pareto }
}

const getTotalDownTime = rs => {
  const reducer = (accumulator, currentValue) =>
    accumulator + currentValue.total
  return rs.recordset.reduce(reducer, 0)
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
     WHERE ShiftSeq like '${shiftseq}%' AND JobSeq is not NULL AND CalProdQty > 0
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
      console.log(rs.Total)
      if (rs.Total > 0) {
        return createDayData(rs, down.recordset[i], shiftseq)
      } else {
        return null
      }
    })

    pool.close()
    return data
  } catch (err) {
    console.error(err)
  }
}

export const callLineData = async (shiftseq, monthseq, id) => {
  let data = {}

  const query1 = `SELECT [MachNo]
   , SUM(((([TotTime]-[DownTime])/60) * [ExpCycTm])) As Target
   , SUM([CalProdQty]) As Total
   , SUM([TotTime] / 60) As TotalTime
   , SUM((TotTime - DownTime) / 60) As RunTime
   , SUM([DownTime] / 60) As DownTime
   , SUM([NumDownTm]) AS DownFreq
   FROM [MATTEC_PROHELP].[dbo].[vReportShift]
   WHERE ShiftSeq like '${shiftseq}%' AND MachNo = ${id} AND JobSeq is not NULL
   GROUP By MachNo`

  const query2 = `SELECT [MachNo]
,SUM([Qty]) Total
,SUM([NumOccur]) Occur
FROM [MATTEC_PROHELP].[dbo].[ShiftDown]
WHERE ShiftSeq like '${shiftseq}%' AND DownNo = '1' AND MachNo = ${id}
Group By MachNo`

  const queryMonth = `SELECT MachNo
,SUM([ExpProdQty]) Target
,SUM([CalProdQty]) Total
,SUM([DefectQty]) Defects
,SUM([TotTime]) AS TotalTime
,SUM([DownTime]) AS DownTime
,SUM([NumDownTm]) Down_Amounts 
FROM [MATTEC_PROHELP].[dbo].[ShiftProd] 
WHERE ShiftSeq like '${monthseq}' AND MachNo = ${id}
Group By MachNo`

  const downQuery = `
SELECT MachNo, s.DownNo, c.DownCode, SUM([Qty]) total, SUM([NumOccur]) occ
FROM [MATTEC_PROHELP].[dbo].[ShiftDown] s
INNER JOIN DownCodes c ON s.DownNo = c.DownNo
WHERE ShiftSeq >= '201905270' AND MachNo = ${id}
GROUP BY MachNo, s.DownNo, c.DownCode
ORDER BY total DESC
`

  try {
    // make sure that any items are correctly URL encoded in the connection string
    const pool = new ConnectionPool(config)
    await pool.connect()
    const result1 = await pool.request().query(query1)

    const down = await pool.request().query(query2)
    const resultMonth = await pool.request().query(queryMonth)
    const rsDownPareto = await pool.request().query(downQuery)

    const day = createDayData(result1.recordset[0], down.recordset[0], shiftseq)

    const month = createMonthData(resultMonth.recordset[0])

    const totalDownTime = await getTotalDownTime(rsDownPareto)
    const downPareto = createDownPareto(rsDownPareto, totalDownTime)

    data.day = day
    data.month = month
    data.downPareto = downPareto
    pool.close()
    return data
  } catch (err) {
    console.error(err)
  }
}
