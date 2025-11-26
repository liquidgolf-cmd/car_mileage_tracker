import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { StorageService } from '../services/StorageService';
import { Expense, ExpenseCategory } from '../types';
import { format } from 'date-fns';
import ExpenseDetailView from './ExpenseDetailView';

function ExpenseListView() {
  const location = useLocation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all' | 'linked' | 'unlinked'>('all');

  useEffect(() => {
    loadExpenses();
  }, []);

  // Auto-open expense if navigating from receipt
  useEffect(() => {
    const state = location.state as { openExpenseId?: string } | undefined;
    if (state?.openExpenseId && expenses.length > 0) {
      const expenseToOpen = expenses.find(e => e.id === state.openExpenseId);
      if (expenseToOpen) {
        setSelectedExpense(expenseToOpen);
      }
    }
  }, [location.state, expenses]);

  useEffect(() => {
    applyFilters();
  }, [expenses, selectedCategory]);

  const loadExpenses = () => {
    const allExpenses = StorageService.getExpenses();
    setExpenses(allExpenses);
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    if (selectedCategory === 'linked') {
      filtered = filtered.filter(e => e.tripId);
    } else if (selectedCategory === 'unlinked') {
      filtered = filtered.filter(e => !e.tripId);
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    setFilteredExpenses(filtered);
  };

  const handleDelete = (expenseId: string) => {
    if (window.confirm('Delete this expense?')) {
      StorageService.deleteExpense(expenseId);
      loadExpenses();
      if (selectedExpense?.id === expenseId) {
        setSelectedExpense(null);
      }
    }
  };

  const handleCreateExpense = () => {
    const now = new Date();
    const newExpense: Expense = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: now,
      amount: 0,
      category: ExpenseCategory.Other,
      description: '',
      notes: ''
    };
    setSelectedExpense(newExpense);
  };

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (selectedExpense) {
    return (
      <ExpenseDetailView
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onUpdate={(updated) => {
          if (expenses.find(e => e.id === updated.id)) {
            StorageService.updateExpense(updated);
          } else {
            StorageService.saveExpense(updated);
          }
          loadExpenses();
          setSelectedExpense(updated);
        }}
        onDelete={(id) => {
          handleDelete(id);
          setSelectedExpense(null);
        }}
      />
    );
  }

  const allCategories = [
    ...Object.values(ExpenseCategory),
    ...StorageService.getCustomExpenseCategories()
  ].sort();

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Expenses</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            Tap any expense to view and edit details
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateExpense}>
          + Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label" style={{ fontSize: '14px', marginBottom: '4px' }}>Filter by</label>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Expenses</option>
            <option value="linked">Linked to Trip</option>
            <option value="unlinked">Not Linked</option>
            {allCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        {filteredExpenses.length > 0 && (
          <div className="flex-between">
            <span style={{ fontWeight: '600' }}>Total: ${totalAmount.toFixed(2)}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <h3>No expenses yet</h3>
          <p className="text-secondary">
            {selectedCategory !== 'all' 
              ? `No expenses match your filter.` 
              : 'Start tracking your business expenses.'}
          </p>
          <button className="btn btn-primary mt-3" onClick={handleCreateExpense}>
            Add Expense
          </button>
        </div>
      ) : (
        filteredExpenses.map((expense) => {
          const linkedTrip = expense.tripId 
            ? StorageService.getTrips().find(t => t.id === expense.tripId)
            : null;

          return (
            <div
              key={expense.id}
              className="trip-item"
              onClick={() => setSelectedExpense(expense)}
              style={{ position: 'relative' }}
              title="Tap to view and edit expense details"
            >
              <div className="trip-header">
                <span className="trip-category">
                  {expense.category}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="trip-date">
                    {format(new Date(expense.date), 'MMM d, yyyy')}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>✏️ Tap to edit</span>
                </div>
              </div>
              <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>{expense.description}</div>
                {expense.notes && (
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {expense.notes}
                  </div>
                )}
                {linkedTrip && (
                  <div style={{ fontSize: '12px', color: 'var(--primary-color)', marginTop: '4px' }}>
                    🔗 Linked to trip: {format(new Date(linkedTrip.startDate), 'MMM d')}
                  </div>
                )}
              </div>
              <div className="trip-details">
                <div></div>
                <div className="trip-metrics">
                  <div className="trip-amount" style={{ fontSize: '20px', fontWeight: '600' }}>
                    ${expense.amount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default ExpenseListView;

