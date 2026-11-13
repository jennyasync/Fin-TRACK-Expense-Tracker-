import ExpenseItem from './ExpenseItem.jsx'

function ExpenseList({ expenses, totalCount, onEdit, onDelete }) {
  if (totalCount === 0) {
    return (
      <div className="empty">
        <p>No transactions yet</p>
        <p>Use "Add transaction" to record your first one.</p>
      </div>
    )
  }

  if (expenses.length === 0) {
    return <div className="empty">No transactions match your filters</div>
  }

  return (
    <ul className="expense-list">
      {expenses.map((expense) => (
        <ExpenseItem key={expense.id} expense={expense} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  )
}

export default ExpenseList
