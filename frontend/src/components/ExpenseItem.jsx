import { formatCurrency, formatDate } from '../utils/format.js'

function ExpenseItem({ expense, onEdit, onDelete }) {
  const isIncome = expense.type === 'income'

  return (
    <li className="expense-item">
      <div>
        <p className="expense-title">{expense.title}</p>
        <p className="expense-meta">
          {expense.category} · {formatDate(expense.date)}
        </p>
      </div>
      <div className="expense-right">
        <p className={`amount ${isIncome ? 'positive' : 'negative'}`}>
          {isIncome ? '+' : '−'}
          {formatCurrency(expense.amount)}
        </p>
        <div className="expense-actions">
          <button className="btn-link" onClick={() => onEdit(expense)}>
            Edit
          </button>
          <button className="btn-link danger" onClick={() => onDelete(expense)}>
            Delete
          </button>
        </div>
      </div>
    </li>
  )
}

export default ExpenseItem
