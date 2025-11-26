import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/StorageService';
import { Receipt } from '../types';
import { format } from 'date-fns';

function ReceiptListView() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = () => {
    setReceipts(StorageService.getReceipts());
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large. Please select an image smaller than 10MB.');
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);

      // Create receipt object
      const receipt: Receipt = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        imageData: base64,
        uploadDate: new Date()
      };

      // Save receipt first (will be updated with OCR results)
      StorageService.saveReceipt(receipt);

      // Navigate to detail view - OCR will happen there
      navigate(`/receipts/${receipt.id}`);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = (receiptId: string) => {
    if (window.confirm('Delete this receipt?')) {
      StorageService.deleteReceipt(receiptId);
      loadReceipts();
    }
  };

  const processedCount = receipts.filter(r => r.expenseId).length;
  const unprocessedCount = receipts.filter(r => !r.expenseId).length;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '20px' }}>
        <h1>Receipts</h1>
        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
          {isUploading ? 'Uploading...' : '+ Upload Receipt'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {receipts.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '20px',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          <span>Total: {receipts.length}</span>
          <span>Processed: {processedCount}</span>
          <span>Unprocessed: {unprocessedCount}</span>
        </div>
      )}

      {receipts.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
            <h3 style={{ marginBottom: '8px' }}>No Receipts Yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Upload receipts to automatically extract expense information
            </p>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              + Upload First Receipt
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                disabled={isUploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              style={{
                position: 'relative',
                background: 'var(--background)',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: receipt.expenseId ? '2px solid var(--success-color)' : '2px solid transparent'
              }}
              onClick={() => navigate(`/receipts/${receipt.id}`)}
            >
              <button
                className="btn btn-outline"
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  padding: '4px 8px',
                  fontSize: '16px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  zIndex: 10,
                  minWidth: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(receipt.id);
                }}
              >
                ×
              </button>
              <div style={{ 
                width: '100%', 
                aspectRatio: '3/4',
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img
                  src={receipt.imageData}
                  alt="Receipt"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <div style={{ padding: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {format(new Date(receipt.uploadDate), 'MMM d, yyyy')}
                </div>
                {receipt.extractedData?.amount && (
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>
                    ${receipt.extractedData.amount.toFixed(2)}
                  </div>
                )}
                {receipt.expenseId && (
                  <div style={{ fontSize: '10px', color: 'var(--success-color)', marginTop: '4px' }}>
                    ✓ Processed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReceiptListView;

