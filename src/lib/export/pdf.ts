import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface LoanScheduleRow {
  period: number
  date: string
  payment: number
  principal: number
  interest: number
  remainPrincipal: number
  loanPart: string
}

interface LoanInfo {
  name: string
  loanType: string
  providentAmount: number
  commercialAmount: number
  providentRate: number
  commercialRate: number
  years: number
  startDate: string
  repaymentType: string
  remainPrincipal: number
}

const LOAN_TYPES: Record<string, string> = {
  provident_fund: '公积金贷款', commercial: '商业贷款', mixed: '组合贷',
}
const REPAY_TYPES: Record<string, string> = {
  equal_payment: '等额本息', equal_principal: '等额本金',
}

export function exportLoanPDF(loan: LoanInfo, schedules: LoanScheduleRow[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(20)
  doc.setTextColor(31, 41, 55)
  doc.text('贷款还款计划', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, pageWidth / 2, 28, { align: 'center' })

  // Loan info section
  doc.setFontSize(12)
  doc.setTextColor(31, 41, 55)
  doc.text('贷款信息', 14, 40)

  doc.setFontSize(9)
  doc.setTextColor(55, 65, 81)
  const totalPrincipal = (loan.providentAmount || 0) + (loan.commercialAmount || 0)
  const infoLines = [
    `贷款名称: ${loan.name}`,
    `贷款类型: ${LOAN_TYPES[loan.loanType] || loan.loanType}`,
    `还款方式: ${REPAY_TYPES[loan.repaymentType] || loan.repaymentType}`,
    `贷款总额: ¥${totalPrincipal.toLocaleString()}`,
    `剩余本金: ¥${loan.remainPrincipal.toLocaleString()}`,
    `贷款年限: ${loan.years}年`,
    `开始日期: ${loan.startDate}`,
  ]
  if (loan.providentAmount > 0) {
    infoLines.push(`公积金: ¥${loan.providentAmount.toLocaleString()} @ ${loan.providentRate}%`)
  }
  if (loan.commercialAmount > 0) {
    infoLines.push(`商业贷款: ¥${loan.commercialAmount.toLocaleString()} @ ${loan.commercialRate}%`)
  }

  let y = 46
  infoLines.forEach(line => {
    doc.text(line, 14, y)
    y += 5
  })

  // Summary
  const totalPayment = schedules.reduce((s, r) => s + r.payment, 0)
  const totalInterest = schedules.reduce((s, r) => s + r.interest, 0)
  y += 4
  doc.setFontSize(10)
  doc.setTextColor(31, 41, 55)
  doc.text(`总还款: ¥${Math.round(totalPayment).toLocaleString()}    总利息: ¥${Math.round(totalInterest).toLocaleString()}    总期数: ${schedules.length}`, 14, y)

  // Table
  y += 8
  const tableData = schedules.map(s => [
    s.period,
    s.date,
    `¥${s.payment.toFixed(2)}`,
    `¥${s.principal.toFixed(2)}`,
    `¥${s.interest.toFixed(2)}`,
    `¥${s.remainPrincipal.toFixed(2)}`,
    s.loanPart === 'provident' ? '公积金' : s.loanPart === 'commercial' ? '商贷' : '-',
  ])

  autoTable(doc, {
    startY: y,
    head: [['期数', '日期', '月供', '本金', '利息', '剩余本金', '类型']],
    body: tableData,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [109, 139, 116], textColor: 255, fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 247, 244] },
    margin: { left: 14, right: 14 },
  })

  // Footer on each page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(`第 ${i} / ${pageCount} 页`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })
    doc.text('家庭资产管理系统', 14, doc.internal.pageSize.getHeight() - 10)
  }

  doc.save(`贷款还款计划_${loan.name}.pdf`)
}

export function exportAnnualReportPDF(data: {
  year: number
  totalIncome: number
  totalExpense: number
  netAssets: number
  totalAssets: number
  totalDebt: number
  monthlyData: Array<{ month: string; income: number; expense: number }>
  categoryBreakdown: Array<{ category: string; amount: number }>
  loans: Array<{ name: string; remainPrincipal: number }>
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const { year } = data

  // Cover
  doc.setFontSize(28)
  doc.setTextColor(31, 41, 55)
  doc.text('家庭年度财务报告', pageWidth / 2, 60, { align: 'center' })

  doc.setFontSize(48)
  doc.setTextColor(109, 139, 116)
  doc.text(String(year), pageWidth / 2, 85, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, pageWidth / 2, 100, { align: 'center' })
  doc.text('家庭资产管理系统', pageWidth / 2, 106, { align: 'center' })

  // Page 2: Summary
  doc.addPage()
  doc.setFontSize(18)
  doc.setTextColor(31, 41, 55)
  doc.text('年度总览', 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(55, 65, 81)
  let y = 32
  const summaryItems = [
    ['年度总收入', `¥${data.totalIncome.toLocaleString()}`],
    ['年度总支出', `¥${data.totalExpense.toLocaleString()}`],
    ['年度结余', `¥${(data.totalIncome - data.totalExpense).toLocaleString()}`],
    ['净资产', `¥${data.netAssets.toLocaleString()}`],
    ['总资产', `¥${data.totalAssets.toLocaleString()}`],
    ['总负债', `¥${data.totalDebt.toLocaleString()}`],
  ]

  summaryItems.forEach(([label, value]) => {
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text(label, 14, y)
    doc.setFontSize(14)
    doc.setTextColor(31, 41, 55)
    doc.text(value, 14, y + 6)
    y += 16
  })

  // Monthly table
  y += 8
  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.text('月度收支', 14, y)
  y += 6

  autoTable(doc, {
    startY: y,
    head: [['月份', '收入', '支出', '结余']],
    body: data.monthlyData.map(m => [
      m.month,
      `¥${m.income.toLocaleString()}`,
      `¥${m.expense.toLocaleString()}`,
      `¥${(m.income - m.expense).toLocaleString()}`,
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [109, 139, 116], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 247, 244] },
    margin: { left: 14, right: 14 },
  })

  // Page 3: Category breakdown
  doc.addPage()
  doc.setFontSize(18)
  doc.setTextColor(31, 41, 55)
  doc.text('支出分类', 14, 20)

  const CATS: Record<string, string> = {
    mortgage: '房贷', food: '餐饮', utilities: '水电', childcare: '育儿',
    medical: '医疗', transport: '交通', entertainment: '娱乐',
    shopping: '购物', insurance: '保险', other: '其他',
  }

  autoTable(doc, {
    startY: 28,
    head: [['分类', '金额', '占比']],
    body: data.categoryBreakdown.map(c => {
      const pct = data.totalExpense > 0 ? ((c.amount / data.totalExpense) * 100).toFixed(1) : '0'
      return [CATS[c.category] || c.category, `¥${c.amount.toLocaleString()}`, `${pct}%`]
    }),
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [209, 109, 106], textColor: 255 },
    margin: { left: 14, right: 14 },
  })

  // Loans
  if (data.loans.length > 0) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 100
    doc.setFontSize(14)
    doc.setTextColor(31, 41, 55)
    doc.text('贷款状况', 14, finalY + 16)

    autoTable(doc, {
      startY: finalY + 22,
      head: [['贷款名称', '剩余本金']],
      body: data.loans.map(l => [l.name, `¥${l.remainPrincipal.toLocaleString()}`]),
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [124, 141, 181], textColor: 255 },
      margin: { left: 14, right: 14 },
    })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(`${i} / ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })
  }

  doc.save(`家庭年度资产报告_${year}.pdf`)
}
