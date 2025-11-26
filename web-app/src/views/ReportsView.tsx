import { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { PDFService } from '../services/PDFService';
import { Trip, ReportPeriod, TripCategory, Expense, ReportType, ExpenseCategory } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

function ReportsView() {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>(ReportPeriod.Month);
  const [reportType, setReportType] = useState<ReportType>(ReportType.Mileage);
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [selectedCategory, setSelectedCategory] = useState<TripCategory | undefined>(undefined);
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string | undefined>(undefined);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    loadData();
  }, [selectedPeriod, customStartDate, customEndDate, reportType]);

  const loadData = () => {
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

    if (reportType === ReportType.Mileage || reportType === ReportType.Combined) {
      const allTrips = StorageService.getTripsForDateRange(startDate, endDate);
      setTrips(selectedCategory ? allTrips.filter(t => t.category === selectedCategory) : allTrips);
    } else {
      setTrips([]);
    }

    if (reportType === ReportType.Expenses || reportType === ReportType.Combined) {
      const allExpenses = StorageService.getExpensesForDateRange(startDate, endDate);
      setExpenses(selectedExpenseCategory ? allExpenses.filter(e => e.category === selectedExpenseCategory) : allExpenses);
    } else {
      setExpenses([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedExpenseCategory]);

  const totalMiles = trips.reduce((sum, trip) => sum + trip.distance, 0);
  const totalDeduction = trips.reduce((sum, trip) => sum + trip.totalDeduction, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const combinedTotal = totalDeduction + totalExpenses;

  const handleGeneratePDF = () => {
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

    if (reportType === ReportType.Mileage) {
      if (trips.length === 0) {
        alert('No trips found for the selected period.');
        return;
      }
      const allTrips = StorageService.getTripsForDateRange(startDate, endDate);
      PDFService.generatePDF(
        selectedCategory ? allTrips.filter(t => t.category === selectedCategory) : allTrips,
        [],
        reportType,
        selectedPeriod,
        startDate,
        endDate,
        selectedCategory
      );
    } else if (reportType === ReportType.Expenses) {
      if (expenses.length === 0) {
        alert('No expenses found for the selected period.');
        return;
      }
      const allExpenses = StorageService.getExpensesForDateRange(startDate, endDate);
      PDFService.generatePDF(
        [],
        selectedExpenseCategory ? allExpenses.filter(e => e.category === selectedExpenseCategory) : allExpenses,
        reportType,
        selectedPeriod,
        startDate,
        endDate
      );
    } else {
      // Combined
      if (trips.length === 0 && expenses.length === 0) {
        alert('No trips or expenses found for the selected period.');
        return;
      }
      const allTrips = StorageService.getTripsForDateRange(startDate, endDate);
      const allExpenses = StorageService.getExpensesForDateRange(startDate, endDate);
      PDFService.generatePDF(
        selectedCategory ? allTrips.filter(t => t.category === selectedCategory) : allTrips,
        selectedExpenseCategory ? allExpenses.filter(e => e.category === selectedExpenseCategory) : allExpenses,
        reportType,
        selectedPeriod,
        startDate,
        endDate,
        selectedCategory
      );
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginTop: '20px', marginBottom: '20px' }}>Reports</h1>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Report Type</label>
          <select
            className="form-select"
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value as ReportType);
              setSelectedCategory(undefined);
              setSelectedExpenseCategory(undefined);
            }}
          >
            {Object.values(ReportType).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

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

        {(reportType === ReportType.Mileage || reportType === ReportType.Combined) && (
          <div className="form-group">
            <label className="form-label">Filter by Trip Category</label>
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
        )}

        {(reportType === ReportType.Expenses || reportType === ReportType.Combined) && (
          <div className="form-group">
            <label className="form-label">Filter by Expense Category</label>
            <select
              className="form-select"
              value={selectedExpenseCategory || ''}
              onChange={(e) => setSelectedExpenseCategory(e.target.value || undefined)}
            >
              <option value="">All Categories</option>
              {[
                ...Object.values(ExpenseCategory),
                ...StorageService.getCustomExpenseCategories()
              ].sort().map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {(reportType === ReportType.Mileage || reportType === ReportType.Combined) && (
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>
            {reportType === ReportType.Combined ? 'Mileage Summary' : 'Summary'}
          </h3>
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
      )}

      {(reportType === ReportType.Expenses || reportType === ReportType.Combined) && (
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>
            {reportType === ReportType.Combined ? 'Expenses Summary' : 'Summary'}
          </h3>
          <div className="flex-between mb-2">
            <span>Expenses</span>
            <span style={{ fontWeight: '600' }}>{expenses.length}</span>
          </div>
          <div className="flex-between mb-2">
            <span>Total Amount</span>
            <span style={{ fontWeight: '600', color: 'var(--success-color)', fontSize: '20px' }}>
              ${totalExpenses.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {reportType === ReportType.Combined && (
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Combined Total</h3>
          <div className="flex-between mb-2">
            <span style={{ fontSize: '18px', fontWeight: '600' }}>Grand Total</span>
            <span style={{ fontWeight: '600', color: 'var(--success-color)', fontSize: '24px' }}>
              ${combinedTotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <button
        className="btn btn-primary btn-full"
        onClick={handleGeneratePDF}
        disabled={
          (reportType === ReportType.Mileage && trips.length === 0) ||
          (reportType === ReportType.Expenses && expenses.length === 0) ||
          (reportType === ReportType.Combined && trips.length === 0 && expenses.length === 0)
        }
      >
        Generate PDF Report
      </button>
    </div>
  );
}

export default ReportsView;

