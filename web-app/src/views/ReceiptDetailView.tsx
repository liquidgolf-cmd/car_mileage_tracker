import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StorageService } from '../services/StorageService';
import { ReceiptOCRService } from '../services/ReceiptOCRService';
import { Receipt, Expense, ExpenseCategory } from '../types';
import { format } from 'date-fns';

function ReceiptDetailView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showExtractedDataEditor, setShowExtractedDataEditor] = useState(false);
  const [editedAmount, setEditedAmount] = useState<string>('');
  const [editedDate, setEditedDate] = useState<string>('');
  const [editedMerchant, setEditedMerchant] = useState<string>('');

  useEffect(() => {
    if (!id) {
      navigate('/receipts');
      return;
    }

    loadReceipt();
  }, [id, navigate]);

  const loadReceipt = () => {
    if (!id) return;
    const foundReceipt = StorageService.getReceipts().find(r => r.id === id);
    if (!foundReceipt) {
      navigate('/receipts');
      return;
    }
    setReceipt(foundReceipt);
    
    // Set edited values if extracted data exists
    if (foundReceipt.extractedData) {
      setEditedAmount(foundReceipt.extractedData.amount?.toString() || '');
      setEditedDate(foundReceipt.extractedData.date 
        ? format(new Date(foundReceipt.extractedData.date), 'yyyy-MM-dd')
        : format(new Date(foundReceipt.uploadDate), 'yyyy-MM-dd'));
      setEditedMerchant(foundReceipt.extractedData.merchant || '');
    } else {
      // Auto-scan if no extracted data
      handleScan();
    }
  };

  const handleScan = async () => {
    if (!receipt || isScanning) return;

    setIsScanning(true);
    try {
      const extractedData = await ReceiptOCRService.scanReceipt(receipt.imageData);
      
      const updatedReceipt: Receipt = {
        ...receipt,
        extractedData
      };
      
      StorageService.updateReceipt(updatedReceipt);
      setReceipt(updatedReceipt);
      
      // Update edited values
      setEditedAmount(extractedData.amount?.toString() || '');
      setEditedDate(extractedData.date 
        ? format(new Date(extractedData.date), 'yyyy-MM-dd')
        : format(new Date(receipt.uploadDate), 'yyyy-MM-dd'));
      setEditedMerchant(extractedData.merchant || '');
    } catch (error) {
      console.error('Scan error:', error);
      alert('Error scanning receipt. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveExtractedData = () => {
    if (!receipt) return;

    const updatedReceipt: Receipt = {
      ...receipt,
      extractedData: {
        ...receipt.extractedData,
        amount: editedAmount ? parseFloat(editedAmount) : undefined,
        date: editedDate ? new Date(editedDate) : undefined,
        merchant: editedMerchant || undefined,
        confidence: receipt.extractedData?.confidence || 0.5,
        rawText: receipt.extractedData?.rawText || '',
        items: receipt.extractedData?.items
      }
    };

    StorageService.updateReceipt(updatedReceipt);
    setReceipt(updatedReceipt);
    setShowExtractedDataEditor(false);
  };

  const handleConvertToExpense = () => {
    if (!receipt || !receipt.extractedData) {
      alert('Please scan the receipt first or enter expense details.');
      return;
    }

    // Create expense from receipt data
    const expense: Expense = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: receipt.extractedData.date || new Date(receipt.uploadDate),
      amount: receipt.extractedData.amount || 0,
      category: ExpenseCategory.Other,
      description: receipt.extractedData.merchant || 'Receipt expense',
      notes: receipt.extractedData.items?.join(', ') || '',
      receiptImage: receipt.imageData,
      businessId: receipt.businessId,
      tripId: undefined
    };

    // Save expense
    StorageService.saveExpense(expense);
    
    // Link receipt to expense
    StorageService.linkReceiptToExpense(receipt.id, expense.id);
    
    // Navigate to expenses list with the new expense ID to auto-open it
    navigate('/expenses', { state: { openExpenseId: expense.id, fromReceipt: true } });
  };

  const handleDelete = () => {
    if (!receipt) return;
    
    if (window.confirm('Delete this receipt?')) {
      StorageService.deleteReceipt(receipt.id);
      navigate('/receipts');
    }
  };

  if (!receipt) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading receipt...</p>
        </div>
      </div>
    );
  }

  const extractedData = receipt.extractedData;

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Receipt Details</h2>
          <button className="btn btn-outline" onClick={() => navigate('/receipts')}>
            ← Back
          </button>
        </div>

        {/* Receipt Image */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <img
            src={receipt.imageData}
            alt="Receipt"
            style={{
              maxWidth: '100%',
              maxHeight: '500px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          />
        </div>

        {/* Upload Date */}
        <div style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Uploaded: {format(new Date(receipt.uploadDate), 'MMM d, yyyy h:mm a')}
        </div>

        {/* Scan Button */}
        {!extractedData && (
          <button
            className="btn btn-primary btn-full"
            onClick={handleScan}
            disabled={isScanning}
            style={{ marginBottom: '20px' }}
          >
            {isScanning ? 'Scanning...' : 'Scan Receipt'}
          </button>
        )}

        {/* Extracted Data Display */}
        {extractedData && (
          <div style={{
            background: 'var(--background)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Extracted Information</h3>
              <button
                className="btn btn-outline"
                onClick={() => setShowExtractedDataEditor(true)}
                style={{ fontSize: '14px', padding: '6px 12px' }}
              >
                Edit
              </button>
            </div>

            {!showExtractedDataEditor ? (
              <>
                {extractedData.amount && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Amount</div>
                    <div style={{ fontSize: '24px', fontWeight: '600' }}>${extractedData.amount.toFixed(2)}</div>
                  </div>
                )}
                
                {extractedData.date && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Date</div>
                    <div style={{ fontSize: '16px' }}>{format(new Date(extractedData.date), 'MMM d, yyyy')}</div>
                  </div>
                )}
                
                {extractedData.merchant && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Merchant</div>
                    <div style={{ fontSize: '16px' }}>{extractedData.merchant}</div>
                  </div>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Confidence</div>
                  <div style={{ fontSize: '14px' }}>
                    {(extractedData.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                {extractedData.items && extractedData.items.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Items</div>
                    <div style={{ fontSize: '14px' }}>
                      {extractedData.items.slice(0, 3).join(', ')}
                      {extractedData.items.length > 3 && ` (+${extractedData.items.length - 3} more)`}
                    </div>
                  </div>
                )}

                {extractedData.rawText && (
                  <details style={{ marginTop: '12px' }}>
                    <summary style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      View Raw OCR Text
                    </summary>
                    <pre style={{
                      marginTop: '8px',
                      padding: '12px',
                      background: 'white',
                      borderRadius: '4px',
                      fontSize: '11px',
                      overflow: 'auto',
                      maxHeight: '200px',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {extractedData.rawText}
                    </pre>
                  </details>
                )}
              </>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={editedAmount}
                    onChange={(e) => setEditedAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Merchant</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editedMerchant}
                    onChange={(e) => setEditedMerchant(e.target.value)}
                    placeholder="Merchant name"
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    className="btn btn-outline btn-full"
                    onClick={() => setShowExtractedDataEditor(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleSaveExtractedData}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {extractedData && !receipt.expenseId && (
            <button
              className="btn btn-primary btn-full"
              onClick={handleConvertToExpense}
            >
              Convert to Expense
            </button>
          )}

          {receipt.expenseId && (
            <button
              className="btn btn-outline btn-full"
              onClick={() => navigate(`/expenses/${receipt.expenseId}`)}
            >
              View Linked Expense
            </button>
          )}

          <button
            className="btn btn-outline btn-full"
            onClick={handleScan}
            disabled={isScanning}
          >
            {isScanning ? 'Rescanning...' : 'Rescan Receipt'}
          </button>

          <button
            className="btn btn-outline btn-full"
            onClick={handleDelete}
            style={{ color: 'var(--danger-color)' }}
          >
            Delete Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptDetailView;

