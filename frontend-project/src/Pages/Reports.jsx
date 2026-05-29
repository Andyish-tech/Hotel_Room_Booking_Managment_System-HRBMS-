import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../utils/toast';
import { jsPDF } from 'jspdf';

const Reports = () => {
  // ============================================================
  // Bill Generation State
  // ============================================================
  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [bill, setBill] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [exportingBill, setExportingBill] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);

  // ============================================================
  // Daily Report State
  // ============================================================
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const [reportMode, setReportMode] = useState('single'); // 'single' | 'range'
  const [reportDate, setReportDate] = useState(today);
  const [reportStartDate, setReportStartDate] = useState(weekAgo);
  const [reportEndDate, setReportEndDate] = useState(today);
  const [dailyReport, setDailyReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // ============================================================
  // Active tab
  // ============================================================
  const [activeTab, setActiveTab] = useState('bill');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/bookings');
      setBookings(response.data.data || []);
    } catch (error) {
      showError('Failed to fetch bookings');
    }
  };

  // ============================================================
  // Export Bill as PDF
  // ============================================================
  const exportBillAsPDF = () => {
    if (!bill || !bill.booking) {
      showError('No bill to export. Generate a bill first.');
      return;
    }
    setExportingBill(true);
    try {
      const b = bill.booking;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ml = 20;
      const mr = 20;
      const cw = pw - ml - mr;
      let y = 20;

      const drawLine = (yPos) => {
        pdf.setDrawColor(200);
        pdf.setLineWidth(0.5);
        pdf.line(ml, yPos, pw - mr, yPos);
      };
      const drawHeaderBar = (yPos, h) => {
        pdf.setFillColor(239, 191, 4);
        pdf.rect(ml, yPos, cw, h, 'F');
      };
      const checkPage = (needed) => {
        if (y + needed > ph - 25) {
          pdf.setFontSize(8);
          pdf.setTextColor(150);
          pdf.text('Golden Stay Hotel — Huye District, Rwanda — Tel: +250 788 XXX XXX', pw / 2, ph - 10, { align: 'center' });
          pdf.addPage();
          y = 20;
          return true;
        }
        return false;
      };

      drawHeaderBar(y, 28);
      pdf.setFontSize(16);
      pdf.setTextColor(0);
      pdf.setFont(undefined, 'bold');
      pdf.text('GOLDEN STAY HOTEL', pw / 2, y + 10, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text('Huye District, Southern Province, Rwanda', pw / 2, y + 18, { align: 'center' });
      pdf.text('Email: info@goldenstay.rw  |  Tel: +250 788 XXX XXX', pw / 2, y + 24, { align: 'center' });
      y += 36;

      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0);
      pdf.text('HOTEL BILL / INVOICE', pw / 2, y, { align: 'center' });
      y += 8;
      drawLine(y);
      y += 6;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Bill No: #${b.BookingID}`, ml, y);
      pdf.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pw - mr, y, { align: 'right' });
      y += 10;

      checkPage(40);

      const boxW = (cw - 6) / 2;
      pdf.setDrawColor(220);
      pdf.setFillColor(248, 248, 248);
      pdf.roundedRect(ml, y, boxW, 32, 3, 3, 'FD');
      pdf.setFontSize(8);
      pdf.setTextColor(239, 191, 4);
      pdf.setFont(undefined, 'bold');
      pdf.text('CUSTOMER INFORMATION', ml + 4, y + 5);
      pdf.setFontSize(10);
      pdf.setTextColor(0);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Name:  ${b.CustomerName}`, ml + 4, y + 14);
      pdf.text(`Phone: ${b.PhoneNumber || '—'}`, ml + 4, y + 22);

      pdf.roundedRect(ml + boxW + 6, y, boxW, 32, 3, 3, 'FD');
      pdf.setFontSize(8);
      pdf.setTextColor(239, 191, 4);
      pdf.setFont(undefined, 'bold');
      pdf.text('ROOM INFORMATION', ml + boxW + 10, y + 5);
      pdf.setFontSize(10);
      pdf.setTextColor(0);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Room:  ${b.RoomNumber} (${b.RoomType})`, ml + boxW + 10, y + 14);
      pdf.text(`Rate:  ${formatNumber(b.RatePerDay)} Frw / night`, ml + boxW + 10, y + 22);
      y += 40;

      checkPage(30);
      pdf.setDrawColor(220);
      pdf.setFillColor(248, 248, 248);
      pdf.roundedRect(ml, y, cw, 26, 3, 3, 'FD');
      pdf.setFontSize(8);
      pdf.setTextColor(239, 191, 4);
      pdf.setFont(undefined, 'bold');
      pdf.text('STAY DETAILS', ml + 4, y + 5);
      pdf.setFontSize(10);
      pdf.setTextColor(0);
      pdf.setFont(undefined, 'normal');
      const col3 = cw / 3;
      pdf.text(`Check-In:  ${formatDate(b.CheckInDate)}`, ml + 4, y + 14);
      pdf.text(`Check-Out: ${formatDate(b.CheckOutDate)}`, ml + 4 + col3, y + 14);
      pdf.text(`Nights:    ${b.NumberOfDays} day${b.NumberOfDays > 1 ? 's' : ''}`, ml + 4 + col3 * 2, y + 14);
      y += 34;

      checkPage(50);
      const colDesc = cw * 0.5;
      const colQty = cw * 0.15;
      const colRate = cw * 0.175;
      const colAmt = cw * 0.175;
      pdf.setFillColor(0);
      pdf.rect(ml, y, cw, 8, 'F');
      pdf.setTextColor(255);
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      pdf.text('DESCRIPTION', ml + 3, y + 5.5);
      pdf.text('QTY', ml + colDesc + (colQty / 2), y + 5.5, { align: 'center' });
      pdf.text('RATE', ml + colDesc + colQty + (colRate / 2), y + 5.5, { align: 'center' });
      pdf.text('AMOUNT', ml + colDesc + colQty + colRate + (colAmt / 2), y + 5.5, { align: 'center' });
      y += 9;

      pdf.setDrawColor(230);
      pdf.line(ml, y, pw - mr, y);
      pdf.setTextColor(0);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text('Room Accommodation', ml + 3, y + 5);
      pdf.text(String(b.NumberOfDays), ml + colDesc + (colQty / 2), y + 5, { align: 'center' });
      pdf.text(`${formatNumber(b.RatePerDay)} Frw`, ml + colDesc + colQty + (colRate / 2), y + 5, { align: 'center' });
      pdf.setFont(undefined, 'bold');
      pdf.text(`${formatNumber(b.TotalAmount)} Frw`, ml + colDesc + colQty + colRate + (colAmt / 2), y + 5, { align: 'center' });
      y += 10;

      drawLine(y);
      y += 4;
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('TOTAL AMOUNT DUE:', ml + colDesc - 10, y, { align: 'right' });
      pdf.text(`${formatNumber(b.TotalAmount)} Frw`, ml + colDesc + colQty + colRate + (colAmt / 2), y, { align: 'center' });
      y += 12;

      checkPage(30);
      pdf.setDrawColor(220);
      pdf.setFillColor(248, 248, 248);
      pdf.roundedRect(ml, y, cw, 26, 3, 3, 'FD');
      pdf.setFontSize(8);
      pdf.setTextColor(239, 191, 4);
      pdf.setFont(undefined, 'bold');
      pdf.text('PAYMENT SUMMARY', ml + 4, y + 5);
      pdf.setFontSize(10);
      pdf.setTextColor(0);
      pdf.setFont(undefined, 'normal');
      const sumColW = cw / 3;
      pdf.text('Total Amount Due:', ml + 4, y + 15);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${formatNumber(b.TotalAmount)} Frw`, ml + sumColW / 2, y + 15, { align: 'center' });
      pdf.setFont(undefined, 'normal');
      pdf.text('Already Paid:', ml + sumColW + 4, y + 15);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(22, 163, 74);
      pdf.text(`${formatNumber(b.AmountPaid)} Frw`, ml + sumColW + sumColW / 2, y + 15, { align: 'center' });
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0);
      pdf.text('Remaining Balance:', ml + sumColW * 2 + 4, y + 15);
      pdf.setFont(undefined, 'bold');
      const remaining = parseFloat(b.RemainingBalance || 0);
      if (remaining > 0) pdf.setTextColor(220, 38, 38);
      else pdf.setTextColor(22, 163, 74);
      pdf.text(`${formatNumber(b.RemainingBalance)} Frw`, ml + sumColW * 2 + sumColW / 2, y + 15, { align: 'center' });
      pdf.setTextColor(0);
      y += 34;

      if (bill.payments && bill.payments.length > 0) {
        checkPage(20 + bill.payments.length * 7);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(239, 191, 4);
        pdf.text('PAYMENT HISTORY', ml, y);
        y += 6;
        pdf.setDrawColor(220);
        pdf.setFillColor(248, 248, 248);
        pdf.roundedRect(ml, y, cw, 8 + bill.payments.length * 7, 3, 3, 'FD');
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        bill.payments.forEach((payment, idx) => {
          const py = y + 5 + idx * 7;
          pdf.text(`Payment #${idx + 1} — ${new Date(payment.PaymentDate).toLocaleDateString()}`, ml + 4, py);
          pdf.text(`${formatNumber(payment.AmountPaid)} Frw`, pw - mr - 4, py, { align: 'right' });
        });
        y += 14 + bill.payments.length * 7;
      }

      checkPage(30);
      if (y < ph - 50) y = ph - 50;
      drawLine(y);
      y += 6;
      pdf.setFontSize(9);
      pdf.setTextColor(80);
      pdf.setFont(undefined, 'normal');
      pdf.text('Terms & Conditions:', ml, y);
      y += 5;
      pdf.setFontSize(8);
      pdf.text('\u2022 Full payment is due upon check-in.', ml, y);
      y += 4;
      pdf.text('\u2022 Rate includes accommodation only. Additional services are billed separately.', ml, y);
      y += 4;
      pdf.text('\u2022 Check-out time is 11:00 AM. Late check-out may incur additional charges.', ml, y);
      y += 4;
      pdf.text('\u2022 This is a computer-generated invoice and does not require a physical signature.', ml, y);
      y += 10;

      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(239, 191, 4);
      pdf.text('Thank you for choosing Golden Stay Hotel!', pw / 2, y, { align: 'center' });
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.setFont(undefined, 'normal');
      pdf.text('Golden Stay Hotel — Huye District, Rwanda — Tel: +250 788 XXX XXX', pw / 2, ph - 10, { align: 'center' });

      const customerName = b.CustomerName?.replace(/\s+/g, '_') || 'Bill';
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Golden_Stay_Hotel_Bill_${customerName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      showSuccess('Bill exported as PDF successfully!');
    } catch (error) {
      console.error('PDF Export Error:', error);
      showError('Failed to export bill as PDF');
    } finally {
      setExportingBill(false);
    }
  };

  // ============================================================
  // Export Report as PDF
  // ============================================================
  const exportReportAsPDF = () => {
    if (!dailyReport || !dailyReport.payments) {
      showError('No report to export. Fetch a report first.');
      return;
    }
    setExportingReport(true);
    try {
      const r = dailyReport;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ml = 20;
      const mr = 20;
      const cw = pw - ml - mr;
      let y = 20;

      const drawLine = (yPos) => {
        pdf.setDrawColor(200);
        pdf.setLineWidth(0.5);
        pdf.line(ml, yPos, pw - mr, yPos);
      };
      const checkPage = (needed) => {
        if (y + needed > ph - 25) {
          pdf.setFontSize(8);
          pdf.setTextColor(150);
          pdf.text('Golden Stay Hotel — Huye District, Rwanda — Tel: +250 788 XXX XXX', pw / 2, ph - 10, { align: 'center' });
          pdf.addPage();
          y = 20;
          return true;
        }
        return false;
      };

      pdf.setFillColor(239, 191, 4);
      pdf.rect(ml, y, cw, 22, 'F');
      pdf.setFontSize(14);
      pdf.setTextColor(0);
      pdf.setFont(undefined, 'bold');
      pdf.text('GOLDEN STAY HOTEL', pw / 2, y + 8, { align: 'center' });
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.text('Huye District, Southern Province, Rwanda', pw / 2, y + 16, { align: 'center' });
      y += 30;

      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('DAILY PAYMENT REPORT', pw / 2, y, { align: 'center' });
      y += 8;
      drawLine(y);
      y += 6;

      const periodLabel = r.startDate && r.endDate
        ? `Period: ${new Date(r.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} \u2014 ${new Date(r.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
        : `Date: ${new Date(r.reportDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(60);
      pdf.text(periodLabel, pw / 2, y, { align: 'center' });
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pw / 2, y + 5, { align: 'center' });
      y += 14;

      checkPage(30);
      pdf.setDrawColor(220);
      pdf.setFillColor(248, 248, 248);
      pdf.roundedRect(ml, y, cw, 22, 3, 3, 'FD');
      const statW = cw / 3;
      pdf.setFontSize(8);
      pdf.setTextColor(239, 191, 4);
      pdf.setFont(undefined, 'bold');
      pdf.text('TOTAL TRANSACTIONS', ml + statW / 2, y + 5, { align: 'center' });
      pdf.text('TOTAL REVENUE', ml + statW + statW / 2, y + 5, { align: 'center' });
      pdf.text('AVERAGE PAYMENT', ml + statW * 2 + statW / 2, y + 5, { align: 'center' });
      pdf.setFontSize(12);
      pdf.setTextColor(0);
      pdf.setFont(undefined, 'bold');
      pdf.text(String(r.totalPayments || 0), ml + statW / 2, y + 16, { align: 'center' });
      pdf.text(`${formatNumber(r.totalAmount)} Frw`, ml + statW + statW / 2, y + 16, { align: 'center' });
      const avg = r.totalPayments > 0 ? r.totalAmount / r.totalPayments : 0;
      pdf.text(`${formatNumber(avg)} Frw`, ml + statW * 2 + statW / 2, y + 16, { align: 'center' });
      y += 30;

      checkPage(40);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(239, 191, 4);
      pdf.text('PAYMENT DETAILS', ml, y);
      y += 8;
      drawLine(y);
      y += 4;

      if (r.payments.length === 0) {
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(100);
        pdf.text('No payments found for the selected period.', pw / 2, y + 10, { align: 'center' });
      } else {
        const colNo = 10;
        const colName = cw * 0.25;
        const colRoom = cw * 0.12;
        const colCI = cw * 0.17;
        const colCO = cw * 0.17;
        const colDays = cw * 0.08;
        const colAmt = cw * 0.21;
        pdf.setFillColor(0);
        pdf.rect(ml, y, cw, 8, 'F');
        pdf.setTextColor(255);
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'bold');
        pdf.text('#', ml + colNo / 2, y + 5.5, { align: 'center' });
        pdf.text('CUSTOMER NAME', ml + colNo + 3, y + 5.5);
        pdf.text('ROOM', ml + colNo + colName + (colRoom / 2), y + 5.5, { align: 'center' });
        pdf.text('CHECK IN', ml + colNo + colName + colRoom + (colCI / 2), y + 5.5, { align: 'center' });
        pdf.text('CHECK OUT', ml + colNo + colName + colRoom + colCI + (colCO / 2), y + 5.5, { align: 'center' });
        pdf.text('DAYS', ml + colNo + colName + colRoom + colCI + colCO + (colDays / 2), y + 5.5, { align: 'center' });
        pdf.text('AMOUNT', ml + colNo + colName + colRoom + colCI + colCO + colDays + (colAmt / 2), y + 5.5, { align: 'center' });
        y += 10;

        const rowH = 7;
        r.payments.forEach((payment, idx) => {
          checkPage(rowH * 3 + 15);
          pdf.setDrawColor(230);
          pdf.line(ml, y, pw - mr, y);
          pdf.setFontSize(8);
          pdf.setTextColor(0);
          pdf.setFont(undefined, 'normal');
          pdf.text(String(idx + 1), ml + colNo / 2, y + rowH - 1.5, { align: 'center' });
          pdf.text(payment.CustomerName || '', ml + colNo + 3, y + rowH - 1.5);
          pdf.text(payment.RoomNumber || '', ml + colNo + colName + (colRoom / 2), y + rowH - 1.5, { align: 'center' });
          pdf.text(new Date(payment.CheckInDate).toLocaleDateString(), ml + colNo + colName + colRoom + (colCI / 2), y + rowH - 1.5, { align: 'center' });
          pdf.text(new Date(payment.CheckOutDate).toLocaleDateString(), ml + colNo + colName + colRoom + colCI + (colCO / 2), y + rowH - 1.5, { align: 'center' });
          pdf.text(String(payment.NumberOfDays), ml + colNo + colName + colRoom + colCI + colCO + (colDays / 2), y + rowH - 1.5, { align: 'center' });
          pdf.setFont(undefined, 'bold');
          pdf.text(`${formatNumber(payment.AmountPaid)} Frw`, ml + colNo + colName + colRoom + colCI + colCO + colDays + (colAmt / 2), y + rowH - 1.5, { align: 'center' });
          y += rowH;
        });

        drawLine(y);
        y += 4;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text('TOTAL:', ml + colNo + colName + colRoom + colCI + colCO + (colDays / 2) - 5, y, { align: 'right' });
        pdf.text(`${formatNumber(r.totalAmount)} Frw`, ml + colNo + colName + colRoom + colCI + colCO + colDays + (colAmt / 2), y, { align: 'center' });
        y += 12;
      }

      checkPage(20);
      if (y < ph - 40) y = ph - 40;
      drawLine(y);
      y += 6;
      pdf.setFontSize(8);
      pdf.setTextColor(120);
      pdf.setFont(undefined, 'normal');
      pdf.text('This is a computer-generated report. No signature is required.', pw / 2, y, { align: 'center' });
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(239, 191, 4);
      pdf.text('Golden Stay Hotel \u2014 Excellence in Hospitality', pw / 2, ph - 20, { align: 'center' });
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.setFont(undefined, 'normal');
      pdf.text('Golden Stay Hotel — Huye District, Rwanda — Tel: +250 788 XXX XXX', pw / 2, ph - 10, { align: 'center' });

      const dateLabel = r.startDate ? `${r.startDate}_to_${r.endDate}` : (r.reportDate || 'Report');
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Golden_Stay_Hotel_Report_${dateLabel}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      showSuccess('Report exported as PDF successfully!');
    } catch (error) {
      console.error('PDF Export Error:', error);
      showError('Failed to export report as PDF');
    } finally {
      setExportingReport(false);
    }
  };

  // ============================================================
  // Generate Bill
  // ============================================================ 
  const generateBill = async () => {
    if (!selectedBookingId) {
      showError('Please select a booking');
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.get(`/payments/bill/${selectedBookingId}`);
      if (response.data.success) {
        setBill(response.data.data);
        showSuccess('Bill generated successfully!');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to generate bill';
      showError(message);
      setBill(null);
    } finally {
      setGenerating(false);
    }
  };

  // ============================================================
  // Fetch Daily Report
  // ============================================================
  const fetchDailyReport = async () => {
    const params = {};
    if (reportMode === 'range') {
      if (!reportStartDate || !reportEndDate) {
        showError('Please select both start and end dates');
        return;
      }
      if (reportStartDate > reportEndDate) {
        showError('Start date cannot be after end date');
        return;
      }
      params.startDate = reportStartDate;
      params.endDate = reportEndDate;
    } else {
      if (!reportDate) {
        showError('Please select a date');
        return;
      }
      params.date = reportDate;
    }

    setReportLoading(true);
    try {
      const response = await axios.get('/payments/report/daily', { params });
      if (response.data.success) {
        setDailyReport(response.data.data);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch report';
      showError(message);
      setDailyReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'report') {
      fetchDailyReport();
    }
  }, [activeTab]);

  const formatNumber = (num) => {
    return parseFloat(num || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-black">Reports & Billing</h2>
        <p className="text-black mt-1">
          Generate hotel bills and view daily payment reports
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-200 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('bill')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'bill'
              ? 'bg-brand text-black shadow-sm'
              : 'text-black hover:text-black'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Hotel Bill
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'report'
              ? 'bg-brand text-black shadow-sm'
              : 'text-black hover:text-black'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Daily Report
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: Hotel Bill Generation                                    */}
      {/* ============================================================ */}
      {activeTab === 'bill' && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-brand to-yellow-600 rounded-2xl p-6 text-black shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Hotel Bill Generation</h3>
                <p className="text-black/70 text-sm">
                  Select a booking to automatically calculate the bill. Customers are charged 
                  <span className="font-bold text-black"> 25,000 Frw</span> per day.
                </p>
              </div>
            </div>
          </div>

          {/* Select Booking */}
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="form-label">Select Booking</label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => {
                    setSelectedBookingId(e.target.value);
                    setBill(null);
                  }}
                  className="input-field"
                >
                  <option value="">Choose a booking...</option>
                  {bookings.map((booking) => (
                    <option key={booking.BookingID} value={booking.BookingID}>
                      #{booking.BookingID} - {booking.CustomerName} 
                      (Room {booking.RoomNumber} | {new Date(booking.CheckInDate).toLocaleDateString()} 
                      → {new Date(booking.CheckOutDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={generateBill}
                  disabled={generating || !selectedBookingId}
                  className="btn-primary flex items-center gap-2 px-8"
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate Bill
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bill Result */}
          {bill && (
            <div className="card border-2 border-gray-200">
              {/* Bill Header */}
              <div className="text-center border-b border-gray-200 pb-6 mb-6">
                <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9.3V4h-3v2.6L12 3 2 12h3v8h5v-6h4v6h5v-8h3l-3-2.7zm-9 .7c0-1.1.9-2 2-2s2 .9 2 2h-4z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-black">Golden Stay Hotel</h3>
                <p className="text-black">Huye District, Southern Province, Rwanda</p>
                <p className="text-black text-sm mt-1">INVOICE / HOTEL BILL</p>
              </div>

              {/* Bill Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>                      <h4 className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Customer Information</h4>                       <div className="bg-white rounded-xl p-4 space-y-2 border border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-sm text-black">Name:</span>
                      <span className="text-sm font-semibold text-black">{bill.booking.CustomerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-black">Phone:</span>
                      <span className="text-sm text-black">{bill.booking.PhoneNumber}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Room Information</h4>
                  <div className="bg-white rounded-xl p-4 space-y-2 border border-gray-200">
                    <div className="flex justify-between">                        <span className="text-sm text-black">Room:</span>
                        <span className="text-sm font-semibold text-black">{bill.booking.RoomNumber} ({bill.booking.RoomType})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-black">Bill No:</span>
                      <span className="text-sm text-black">#{bill.booking.BookingID}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stay Details */}
              <h4 className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Stay Details</h4>
              <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-black">Check-In Date</p>
                    <p className="font-semibold text-black">{formatDate(bill.booking.CheckInDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-black">Check-Out Date</p>
                    <p className="font-semibold text-black">{formatDate(bill.booking.CheckOutDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-black">Number of Days</p>
                    <p className="font-semibold text-black">{bill.booking.NumberOfDays} day{bill.booking.NumberOfDays > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              {/* Bill Table */}
              <div className="overflow-hidden rounded-xl border border-gray-200 mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black text-white">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase">Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3 text-sm text-black">Room Accommodation</td>
                      <td className="px-4 py-3 text-sm text-right text-black">{bill.booking.NumberOfDays}</td>
                      <td className="px-4 py-3 text-sm text-right text-black">{formatNumber(bill.booking.RatePerDay)} Frw</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-black">{formatNumber(bill.booking.TotalAmount)} Frw</td>
                    </tr>
                  </tbody>
                  <tfoot>                        <tr className="bg-gray-50">
                      <td colSpan="3" className="px-4 py-3 text-sm font-bold text-black text-right">Total Amount Due:</td>                       <td className="px-4 py-3 text-sm font-bold text-right text-black text-lg">{formatNumber(bill.booking.TotalAmount)} Frw</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                  <p className="text-xs text-black/60 uppercase tracking-wider font-semibold mb-1">Total Amount Due</p>
                  <p className="text-xl font-bold text-black">
                    {formatNumber(bill.booking.TotalAmount)} Frw
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                  <p className="text-xs text-black/60 uppercase tracking-wider font-semibold mb-1">Amount Paid</p>
                  <p className="text-xl font-bold text-green-700">
                    {formatNumber(bill.booking.AmountPaid)} Frw
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                  <p className="text-xs text-black/60 uppercase tracking-wider font-semibold mb-1">Remaining Balance</p>
                  <p className={`text-xl font-bold ${
                    parseFloat(bill.booking.RemainingBalance || 0) > 0 ? 'text-red-600' : 'text-green-700'
                  }`}>
                    {formatNumber(bill.booking.RemainingBalance)} Frw
                  </p>
                  {parseFloat(bill.booking.RemainingBalance || 0) <= 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 mt-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Fully Paid
                    </span>
                  )}
                </div>
              </div>

              {/* Payment History */}
              {bill.payments && bill.payments.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Payment History</h4>
                  <div className="bg-gray-100 rounded-xl p-4">
                    {bill.payments.map((payment, idx) => (
                      <div key={payment.PaymentID} className="flex justify-between py-1">
                        <span className="text-sm text-black">Payment #{idx + 1} — {new Date(payment.PaymentDate).toLocaleDateString()}</span>
                        <span className="text-sm font-semibold text-black">{formatNumber(payment.AmountPaid)} Frw</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons - hidden when printing */}
              <div className="flex justify-center gap-3 pt-4 border-t border-gray-100 print:hidden">
                <button
                  onClick={exportBillAsPDF}
                  disabled={exportingBill}
                  className="btn-danger flex items-center gap-2 px-6"
                >
                  {exportingBill ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  {exportingBill ? 'Exporting...' : 'Export PDF'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-secondary flex items-center gap-2 px-6"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Bill
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: Daily Payment Report                                    */}
      {/* ============================================================ */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-brand to-yellow-600 rounded-2xl p-6 text-black shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Daily Payment Report</h3>
                <p className="text-black/70 text-sm">
                  View all payments recorded on a specific date with totals
                </p>
              </div>
            </div>
          </div>

          {/* Date Filter — Toggle between Single Date and Date Range */}
          <div className="card">
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setReportMode('single')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  reportMode === 'single'                    ? 'bg-brand text-black shadow-sm'
                    : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                Single Date
              </button>
              <button
                onClick={() => setReportMode('range')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  reportMode === 'range'
                    ? 'bg-brand text-black shadow-sm'
                    : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                Date Range
              </button>
            </div>

            {/* Date Inputs */}
            <div className="flex flex-col sm:flex-row gap-4">
              {reportMode === 'single' ? (
                <div className="flex-1">
                  <label className="form-label">Select Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <label className="form-label">From Date</label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="form-label">To Date</label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </>
              )}
              <div className="flex items-end">
                <button
                  onClick={fetchDailyReport}
                  disabled={reportLoading}
                  className="btn-primary flex items-center gap-2 px-8"
                >
                  {reportLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Report Results */}
          {dailyReport && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="stat-card">
                  <div className="bg-brand p-3 rounded-lg text-black">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-black">Report Period</p>
                    <p className="text-lg font-bold text-black">
                      {dailyReport.startDate && dailyReport.endDate
                        ? `${new Date(dailyReport.startDate).toLocaleDateString()} — ${new Date(dailyReport.endDate).toLocaleDateString()}`
                        : new Date(dailyReport.reportDate).toLocaleDateString()
                      }
                    </p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="bg-brand p-3 rounded-lg text-black">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-black">Total Transactions</p>
                    <p className="text-lg font-bold text-black">{dailyReport.totalPayments}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="bg-brand p-3 rounded-lg text-black">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-black">Total Amount</p>
                    <p className="text-lg font-bold text-black">{formatNumber(dailyReport.totalAmount)} Frw</p>
                  </div>
                </div>
              </div>

              {/* Report Table */}
              <div className="card">
                <h3 className="text-lg font-bold text-black mb-4">
                  Payment Details — {dailyReport.startDate && dailyReport.endDate
                    ? `${new Date(dailyReport.startDate).toLocaleDateString()} to ${new Date(dailyReport.endDate).toLocaleDateString()}`
                    : new Date(dailyReport.reportDate).toLocaleDateString()
                  }
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="table-header">
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">Customer Name</th>
                        <th className="px-4 py-3 text-left">Room Number</th>
                        <th className="px-4 py-3 text-left">Check In</th>
                        <th className="px-4 py-3 text-left">Check Out</th>
                        <th className="px-4 py-3 text-left">Days</th>
                        <th className="px-4 py-3 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dailyReport.payments.length > 0 ? (
                        dailyReport.payments.map((payment, idx) => (                           <tr key={payment.PaymentID} className="hover:bg-yellow-200 transition-colors">
                            <td className="table-cell font-medium text-gray-600">{idx + 1}</td>
                            <td className="table-cell font-medium text-black">{payment.CustomerName}</td>
                            <td className="table-cell">
                              <span className="px-2 py-1 bg-brand text-black rounded text-xs font-medium">
                                {payment.RoomNumber}
                              </span>
                            </td>
                            <td className="table-cell">{new Date(payment.CheckInDate).toLocaleDateString()}</td>
                            <td className="table-cell">{new Date(payment.CheckOutDate).toLocaleDateString()}</td>
                            <td className="table-cell">{payment.NumberOfDays}</td>
                            <td className="table-cell text-right font-semibold text-black">
                              {formatNumber(payment.AmountPaid)} Frw
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-12 text-center text-black">
                            <div className="flex flex-col items-center gap-2">
                              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                              <p>No payments found for this date</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {dailyReport.payments.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-50 font-semibold">
                          <td colSpan="6" className="px-4 py-3 text-sm text-right text-black">Total:</td>
                          <td className="px-4 py-3 text-sm text-right text-black">{formatNumber(dailyReport.totalAmount)} Frw</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Action Buttons - hidden when printing */}
              <div className="flex justify-center gap-3 print:hidden">
                <button
                  onClick={exportReportAsPDF}
                  disabled={exportingReport}
                  className="btn-danger flex items-center gap-2 px-6"
                >
                  {exportingReport ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  {exportingReport ? 'Exporting...' : 'Export PDF'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-secondary flex items-center gap-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Report
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
