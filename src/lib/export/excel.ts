import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

interface ExpenseRow {
  date: string
  category: string
  amount: number
  payMethod: string
  remark: string
  user: string
}

interface IncomeRow {
  date: string
  type: string
  amount: number
  remark: string
  user: string
}

const CATEGORY_LABELS: Record<string, string> = {
  mortgage: '房贷', food: '餐饮', utilities: '水电', childcare: '育儿',
  medical: '医疗', transport: '交通', entertainment: '娱乐',
  shopping: '购物', insurance: '保险', other: '其他',
}

const INCOME_LABELS: Record<string, string> = {
  salary: '工资', bonus: '奖金', side_income: '副业', other: '其他',
}

const PAY_LABELS: Record<string, string> = {
  alipay: '支付宝', wechat: '微信', card: '银行卡', cash: '现金',
}

export async function exportExpenseExcel(expenses: ExpenseRow[], period: string) {
  const wb = new ExcelJS.Workbook()
  wb.creator = '家庭资产管理系统'
  wb.created = new Date()

  const ws = wb.addWorksheet('支出明细')

  // Title
  ws.mergeCells('A1:F1')
  const titleCell = ws.getCell('A1')
  titleCell.value = `支出明细 - ${period}`
  titleCell.font = { size: 16, bold: true, color: { argb: '1F2937' } }
  titleCell.alignment = { vertical: 'middle' }
  ws.getRow(1).height = 30

  // Generated time
  ws.mergeCells('A2:F2')
  const timeCell = ws.getCell('A2')
  timeCell.value = `导出时间: ${new Date().toLocaleString('zh-CN')}`
  timeCell.font = { size: 10, color: { argb: '6B7280' } }
  ws.getRow(2).height = 20

  // Empty row
  ws.getRow(3).height = 8

  // Headers
  const headers = ['日期', '分类', '金额 (元)', '支付方式', '备注', '录入人']
  const headerRow = ws.addRow(headers)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6D8B74' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = { bottom: { style: 'thin', color: { argb: 'E5E7EB' } } }
  })
  headerRow.height = 24

  // Data rows
  let totalAmount = 0
  expenses.forEach((exp) => {
    totalAmount += exp.amount
    const row = ws.addRow([
      exp.date,
      CATEGORY_LABELS[exp.category] || exp.category,
      exp.amount,
      PAY_LABELS[exp.payMethod] || exp.payMethod,
      exp.remark || '',
      exp.user,
    ])
    row.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: 'middle' }
      cell.border = { bottom: { style: 'thin', color: { argb: 'F1F5F9' } } }
      if (colNumber === 3) {
        cell.numFmt = '#,##0.00'
        cell.font = { bold: true, color: { argb: 'D16D6A' } }
      }
    })
  })

  // Total row
  ws.addRow([])
  const totalRow = ws.addRow(['', '合计', totalAmount, '', '', ''])
  totalRow.getCell(2).font = { bold: true, size: 12 }
  totalRow.getCell(3).font = { bold: true, size: 12, color: { argb: 'D16D6A' } }
  totalRow.getCell(3).numFmt = '#,##0.00'

  // Column widths
  ws.columns = [
    { width: 14 }, { width: 10 }, { width: 14 }, { width: 12 }, { width: 20 }, { width: 10 },
  ]

  // Export
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `支出明细_${period}.xlsx`)
}

export async function exportIncomeExcel(incomes: IncomeRow[], period: string) {
  const wb = new ExcelJS.Workbook()
  wb.creator = '家庭资产管理系统'
  wb.created = new Date()

  const ws = wb.addWorksheet('收入明细')

  ws.mergeCells('A1:E1')
  ws.getCell('A1').value = `收入明细 - ${period}`
  ws.getCell('A1').font = { size: 16, bold: true, color: { argb: '1F2937' } }
  ws.getRow(1).height = 30

  ws.mergeCells('A2:E2')
  ws.getCell('A2').value = `导出时间: ${new Date().toLocaleString('zh-CN')}`
  ws.getCell('A2').font = { size: 10, color: { argb: '6B7280' } }
  ws.getRow(3).height = 8

  const headers = ['日期', '类型', '金额 (元)', '备注', '录入人']
  const headerRow = ws.addRow(headers)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F8A5B' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })
  headerRow.height = 24

  let total = 0
  incomes.forEach((inc) => {
    total += inc.amount
    const row = ws.addRow([
      inc.date,
      INCOME_LABELS[inc.type] || inc.type,
      inc.amount,
      inc.remark || '',
      inc.user,
    ])
    row.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: 'middle' }
      if (colNumber === 3) {
        cell.numFmt = '#,##0.00'
        cell.font = { bold: true, color: { argb: '4F8A5B' } }
      }
    })
  })

  ws.addRow([])
  const totalRow = ws.addRow(['', '合计', total, '', ''])
  totalRow.getCell(3).font = { bold: true, size: 12, color: { argb: '4F8A5B' } }
  totalRow.getCell(3).numFmt = '#,##0.00'

  ws.columns = [{ width: 14 }, { width: 10 }, { width: 14 }, { width: 20 }, { width: 10 }]

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `收入明细_${period}.xlsx`)
}
