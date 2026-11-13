import { formatCurrency } from '../utils/format.js'

function SummaryCards({ income, expenses }) {
  const balance = income - expenses

  return (
    <section className="summary">
      <div className="card">
        <p className="card-label">Income</p>
        <p className="card-value positive">{formatCurrency(income)}</p>
      </div>
      <div className="card">
        <p className="card-label">Expenses</p>
        <p className="card-value negative">{formatCurrency(expenses)}</p>
      </div>
      <div className="card">
        <p className="card-label">Balance</p>
        <p className={`card-value ${balance >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(balance)}</p>
      </div>
    </section>
  )
}

export default SummaryCards
