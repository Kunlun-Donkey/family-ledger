/**
 * Loan Calculator Engine
 * Supports: equal_payment (等额本息), equal_principal (等额本金)
 * Features: schedule generation, prepayment recalculation, rate adjustment
 */

export interface ScheduleItem {
  period: number
  date: string
  payment: number    // 月供
  principal: number  // 本金
  interest: number   // 利息
  remainPrincipal: number
}

export interface LoanParams {
  principal: number       // 贷款本金
  annualRate: number      // 年利率 (e.g., 3.1 means 3.1%)
  totalMonths: number     // 总期数
  repaymentType: 'equal_payment' | 'equal_principal'
  startDate: string       // YYYY-MM-DD
}

/**
 * Generate full repayment schedule
 */
export function generateSchedule(params: LoanParams): ScheduleItem[] {
  const { principal, annualRate, totalMonths, repaymentType, startDate } = params
  const monthlyRate = annualRate / 100 / 12

  if (repaymentType === 'equal_payment') {
    return generateEqualPayment(principal, monthlyRate, totalMonths, startDate)
  } else {
    return generateEqualPrincipal(principal, monthlyRate, totalMonths, startDate)
  }
}

/**
 * 等额本息: A = P * r * (1+r)^n / ((1+r)^n - 1)
 */
function generateEqualPayment(
  principal: number,
  monthlyRate: number,
  totalMonths: number,
  startDate: string
): ScheduleItem[] {
  const schedule: ScheduleItem[] = []

  let monthlyPayment: number
  if (monthlyRate === 0) {
    monthlyPayment = principal / totalMonths
  } else {
    const factor = Math.pow(1 + monthlyRate, totalMonths)
    monthlyPayment = principal * monthlyRate * factor / (factor - 1)
  }

  let remain = principal

  for (let i = 1; i <= totalMonths; i++) {
    const interest = remain * monthlyRate
    const principalPart = monthlyPayment - interest
    remain = remain - principalPart

    // Fix floating point for last period
    if (i === totalMonths) {
      remain = 0
    }

    schedule.push({
      period: i,
      date: addMonths(startDate, i),
      payment: round2(monthlyPayment),
      principal: round2(principalPart),
      interest: round2(interest),
      remainPrincipal: round2(Math.max(0, remain)),
    })
  }

  return schedule
}

/**
 * 等额本金: 每月本金 = P/n, 每月利息 = 剩余本金 * r
 */
function generateEqualPrincipal(
  principal: number,
  monthlyRate: number,
  totalMonths: number,
  startDate: string
): ScheduleItem[] {
  const schedule: ScheduleItem[] = []
  const monthlyPrincipal = principal / totalMonths
  let remain = principal

  for (let i = 1; i <= totalMonths; i++) {
    const interest = remain * monthlyRate
    const payment = monthlyPrincipal + interest
    remain = remain - monthlyPrincipal

    if (i === totalMonths) {
      remain = 0
    }

    schedule.push({
      period: i,
      date: addMonths(startDate, i),
      payment: round2(payment),
      principal: round2(monthlyPrincipal),
      interest: round2(interest),
      remainPrincipal: round2(Math.max(0, remain)),
    })
  }

  return schedule
}

/**
 * Recalculate schedule after prepayment
 * @param remainPrincipal - remaining principal after prepayment
 * @param annualRate - current annual rate
 * @param remainMonths - remaining months (keep duration)
 * @param repaymentType - repayment type
 * @param fromDate - date of prepayment
 */
export function recalculateAfterPrepayment(
  remainPrincipal: number,
  annualRate: number,
  remainMonths: number,
  repaymentType: 'equal_payment' | 'equal_principal',
  fromDate: string
): ScheduleItem[] {
  return generateSchedule({
    principal: remainPrincipal,
    annualRate,
    totalMonths: remainMonths,
    repaymentType,
    startDate: fromDate,
  })
}

/**
 * Recalculate schedule after rate change
 */
export function recalculateAfterRateChange(
  remainPrincipal: number,
  newAnnualRate: number,
  remainMonths: number,
  repaymentType: 'equal_payment' | 'equal_principal',
  fromDate: string
): ScheduleItem[] {
  return generateSchedule({
    principal: remainPrincipal,
    annualRate: newAnnualRate,
    totalMonths: remainMonths,
    repaymentType,
    startDate: fromDate,
  })
}

/**
 * Calculate total interest for a schedule
 */
export function calculateTotalInterest(schedule: ScheduleItem[]): number {
  return round2(schedule.reduce((sum, item) => sum + item.interest, 0))
}

/**
 * Calculate total payment for a schedule
 */
export function calculateTotalPayment(schedule: ScheduleItem[]): number {
  return round2(schedule.reduce((sum, item) => sum + item.payment, 0))
}

// Helpers
function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr)
  date.setMonth(date.getMonth() + months)
  return date.toISOString().slice(0, 10)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
