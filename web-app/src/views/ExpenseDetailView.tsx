import { useState } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { format } from 'date-fns';
import { StorageService } from '../services/StorageService';

interface ExpenseDetailViewProps {
  expense: Expense;
  onClose: () => void;
  onUpdate: (expense: Expense) => void;
  onDelete: (id: string) => void;
  preLinkedTripId?: string; // Optional: pre-select a trip when creating from trip context
}

function ExpenseDetailView({ expense, onUpdate, onDelete, onClose, preLinkedTripId }: ExpenseDetailViewProps) {
  const [date, setDate] = useState(format(new Date(expense.date), "yyyy-MM-dd"));
  const [amount, setAmount] = useState(expense.amount > 0 ? expense.amount.toString() : '');
  const [category, setCategory] = useState<string>(expense.category);
  const [description, setDescription] = useState(expense.description || '');
  const [notes, setNotes] = useState(expense.notes || '');
  const [tripId, setTripId] = useState<string>(expense.tripId || preLinkedTripId || '');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);

  const allCategories = [
    ...Object.values(ExpenseCategory),
    ...StorageService.getCustomExpenseCategories()
  ].sort();

  const trips = StorageService.getTrips().slice(0, 20); // Show recent 20 trips

  const isNewExpense = !expense.description || expense.description.trim() === '';

  const handleSave = () => {
    // Validation
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount (greater than 0)');
      return;
    }

    if (!category || category.trim() === '') {
      alert('Please select a category');
      return;
    }

    const expenseDate = new Date(date);
    if (isNaN(expenseDate.getTime())) {
      alert('Please enter a valid date');
      return;
    }

    const updatedExpense: Expense = {
      ...expense,
      date: expenseDate,
      amount: parseFloat(parseFloat(amount).toFixed(2)),
      category: category.trim(),
      description: description.trim(),
      notes: notes.trim(),
      tripId: tripId || undefined
    };

    onUpdate(updatedExpense);
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) {
      alert('Please enter a category name');
      return;
    }

    // Check if already exists
    if (allCategories.includes(trimmed)) {
      alert('This category already exists');
      setCustomCategoryInput('');
      setShowCustomCategoryInput(false);
      return;
    }

    StorageService.addCustomExpenseCategory(trimmed);
    setCategory(trimmed);
    setCustomCategoryInput('');
    setShowCustomCategoryInput(false);
  };

  const linkedTrip = tripId ? trips.find(t => t.id === tripId) : null;

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>{isNewExpense ? 'New Expense' : 'Edit Expense'}</h2>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Date *</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Amount *</label>
          <input
            type="number"
            className="form-input"
            value={amount}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty or valid positive numbers
              if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                setAmount(value);
              }
            }}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          {amount && parseFloat(amount) > 0 && (
            <div style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              ${parseFloat(amount).toFixed(2)}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Category *</label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setShowCustomCategoryInput(true);
              } else {
                setCategory(e.target.value);
                setShowCustomCategoryInput(false);
              }
            }}
          >
            <option value="">Select category...</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="__custom__">+ Add Custom Category</option>
          </select>
          
          {showCustomCategoryInput && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                placeholder="Category name"
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomCategory();
                  }
                  if (e.key === 'Escape') {
                    setShowCustomCategoryInput(false);
                    setCustomCategoryInput('');
                  }
                }}
                autoFocus
              />
              <button className="btn btn-primary" onClick={handleAddCustomCategory}>
                Add
              </button>
              <button className="btn btn-outline" onClick={() => {
                setShowCustomCategoryInput(false);
                setCustomCategoryInput('');
              }}>
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <input
            type="text"
            className="form-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Office supplies, Client lunch, etc."
            maxLength={200}
          />
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {description.length}/200 characters
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Link to Trip (Optional)</label>
          <select
            className="form-select"
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
          >
            <option value="">No trip link</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {format(new Date(trip.startDate), 'MMM d, yyyy')} - {trip.startLocation} to {trip.endLocation}
              </option>
            ))}
          </select>
          {linkedTrip && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'var(--background)', borderRadius: '8px', fontSize: '14px' }}>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Linked Trip:</div>
              <div>{format(new Date(linkedTrip.startDate), 'MMM d, yyyy')}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                {linkedTrip.startLocation} → {linkedTrip.endLocation}
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Notes (Optional)</label>
          <textarea
            className="form-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes about this expense..."
            rows={3}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button className="btn btn-primary btn-full" onClick={handleSave}>
            Save Expense
          </button>
          {!isNewExpense && (
            <button
              className="btn btn-outline"
              onClick={() => {
                if (window.confirm('Delete this expense?')) {
                  onDelete(expense.id);
                }
              }}
              style={{ minWidth: '80px' }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExpenseDetailView;

