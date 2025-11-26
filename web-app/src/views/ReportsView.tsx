import { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { PDFService } from '../services/PDFService';
import { Trip, ReportPeriod, TripCategory } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

function ReportsView() {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>(ReportPeriod.Month);
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [selectedCategory, setSelectedCategory] = useState<TripCategory | undefined>(undefined);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    loadTrips();
  }, [selectedPeriod, customStartDate, customEndDate]);

  const loadTrips = () => {
    let startDate: Date;
    let endDate: Date;

    if (selectedPeriod === ReportPeriod.Custom) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      const range = PDFService.getDateRangeForPeriod(selectedPeriod);
      startDate = range.start;
      endDate = range.end;
    }

    const allTrips = StorageService.getTripsForDateRange(startDate, endDate);
    setTrips(selectedCategory ? allTrips.filter(t => t.category === selectedCategory) : allTrips);
  };

  useEffect(() => {
    loadTrips();
  }, [selectedCategory]);

  const totalMiles = trips.reduce((sum, trip) => sum + trip.distance, 0);
  const totalDeduction = trips.reduce((sum, trip) => sum + trip.totalDeduction, 0);

  const handleGeneratePDF = () => {
    if (trips.length === 0) {
      alert('No trips found for the selected period.');
      return;
    }

    let startDate: Date;
    let endDate: Date;

    if (selectedPeriod === ReportPeriod.Custom) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      const range = PDFService.getDateRangeForPeriod(selectedPeriod);
      startDate = range.start;
      endDate = range.end;
    }

    const allTrips = StorageService.getTripsForDateRange(startDate, endDate);
    PDFService.generatePDF(
      selectedCategory ? allTrips.filter(t => t.category === selectedCategory) : allTrips,
      selectedPeriod,
      startDate,
      endDate,
      selectedCategory
    );
  };

  return (
    <div className="container">
      <h1 style={{ marginTop: '20px', marginBottom: '20px' }}>Reports</h1>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Report Period</label>
          <select
            className="form-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as ReportPeriod)}
          >
            {Object.values(ReportPeriod).map((period) => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
        </div>

        {selectedPeriod === ReportPeriod.Custom && (
          <>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label">Filter by Category</label>
          <select
            className="form-select"
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? e.target.value as TripCategory : undefined)}
          >
            <option value="">All Categories</option>
            {Object.values(TripCategory).map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-2">
          <span>Trips</span>
          <span style={{ fontWeight: '600' }}>{trips.length}</span>
        </div>
        <div className="flex-between mb-2">
          <span>Total Miles</span>
          <span style={{ fontWeight: '600' }}>{totalMiles.toFixed(2)}</span>
        </div>
        <div className="flex-between mb-2">
          <span>Total Deduction</span>
          <span style={{ fontWeight: '600', color: 'var(--success-color)', fontSize: '20px' }}>
            ${totalDeduction.toFixed(2)}
          </span>
        </div>
      </div>

      <button
        className="btn btn-primary btn-full"
        onClick={handleGeneratePDF}
        disabled={trips.length === 0}
      >
        Generate PDF Report
      </button>
    </div>
  );
}

export default ReportsView;

