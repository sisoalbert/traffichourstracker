// app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { addRecord, getAllRecords, deleteRecord } from '../utils/db';
import { Plus, Upload, Download, Trash2 } from 'lucide-react';

interface Record {
  id?: number;
  date: string;
  startTime: string;
  endTime: string;
  comments: string;
}

export default function Home() {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [comments, setComments] = useState('');
  const [records, setRecords] = useState<Record[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: Record = {
      date,
      startTime,
      endTime,
      comments,
    };

    await addRecord(newRecord);
    await fetchRecords();

    // Reset form fields
    setDate('');
    setStartTime('');
    setEndTime('');
    setComments('');

    // Close the modal
    setIsModalOpen(false);
  };

  const fetchRecords = async () => {
    const allRecords = await getAllRecords();
    setRecords(allRecords);
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this record?'
    );
    if (confirmDelete) {
      await deleteRecord(id);
      await fetchRecords();
    }
  };

  const handleExportCSV = async () => {
    const allRecords = await getAllRecords();
    if (allRecords.length === 0) {
      alert('No records available to export.');
      return;
    }

    const csvContent = convertRecordsToCSV(allRecords);

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create a link to download the Blob
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Name the file
    link.setAttribute('download', 'traffic_hours.csv');

    // Append link to the body
    document.body.appendChild(link);

    // Trigger the download
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertRecordsToCSV = (records: Record[]) => {
    const headers = ['Date', 'Start Time', 'End Time', 'Comments'];
    const rows = records.map((record) => [
      record.date,
      record.startTime,
      record.endTime,
      record.comments.replace(/\n/g, ' '), // Replace newlines in comments
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${value.replace(/"/g, '""')}"`) // Escape double quotes
          .join(',')
      )
      .join('\n');

    return csvContent;
  };

  const handleImportCSV = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const importedRecords = parseCSVToRecords(text);
      if (importedRecords.length === 0) {
        alert('No valid records found in the CSV file.');
        return;
      }

      // Add records to IndexedDB
      for (const record of importedRecords) {
        await addRecord(record);
      }

      // Refresh displayed records
      await fetchRecords();

      alert(`Successfully imported ${importedRecords.length} records.`);
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('An error occurred while importing the CSV file.');
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  const parseCSVToRecords = (csvText: string): Record[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      // No data to process
      return [];
    }

    const headers = lines[0]
      .split(',')
      .map((header) => header.trim().replace(/"/g, '').toLowerCase());
    const records: Record[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Handle quoted values with commas
      const values = line
        .match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
        ?.map((value) => {
          value = value.trim();
          // Remove surrounding quotes and unescape double quotes
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1).replace(/""/g, '"');
          }
          return value;
        });

      if (!values || values.length !== headers.length) {
        // Skip lines with incorrect number of columns
        continue;
      }

      const record: Record = {
        date: '',
        startTime: '',
        endTime: '',
        comments: '',
      };

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = values[j];
        switch (header) {
          case 'date':
            record.date = value;
            break;
          case 'start time':
            record.startTime = value;
            break;
          case 'end time':
            record.endTime = value;
            break;
          case 'comments':
            record.comments = value;
            break;
          default:
            // Ignore unknown headers
            break;
        }
      }

      // Basic validation
      if (record.date && record.startTime && record.endTime) {
        records.push(record);
      }
    }

    return records;
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Focus the first input when modal opens
  useEffect(() => {
    if (isModalOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isModalOpen]);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Traffic Hours Tracker</h1>

      {/* Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-green-500 text-white rounded flex items-center space-x-2"
        >
          <Plus className="w-5 h-5 sm:hidden" />
          <span className="hidden sm:inline">Add New Record</span>
        </button>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-blue-500 text-white rounded flex items-center space-x-2"
        >
          <Download className="w-5 h-5 sm:hidden" />
          <span className="hidden sm:inline">Export as CSV</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-purple-500 text-white rounded flex items-center space-x-2"
        >
          <Upload className="w-5 h-5 sm:hidden" />
          <span className="hidden sm:inline">Import from CSV</span>
        </button>
        {/* Hidden File Input */}
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImportCSV}
        />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              ✕
            </button>
            {/* Modal Content */}
            <h2 id="modal-title" className="text-xl font-bold mb-4">
              Add New Record
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1">Date</label>
                <input
                  ref={firstInputRef}
                  type="date"
                  className="w-full border p-2"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Start Time</label>
                <input
                  type="time"
                  className="w-full border p-2"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1">End Time</label>
                <input
                  type="time"
                  className="w-full border p-2"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Comments</label>
                <textarea
                  className="w-full border p-2"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 mr-2 bg-gray-300 text-gray-700 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Display Records */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Traffic Hour Records</h2>
        {records.length > 0 ? (
          <>
            {/* Table for larger screens */}
            <table className="w-full table-auto border-collapse hidden sm:table">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Start Time</th>
                  <th className="border px-4 py-2">End Time</th>
                  <th className="border px-4 py-2">Comments</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="border px-4 py-2">{record.date}</td>
                    <td className="border px-4 py-2">{record.startTime}</td>
                    <td className="border px-4 py-2">{record.endTime}</td>
                    <td className="border px-4 py-2">{record.comments}</td>
                    <td className="border px-4 py-2 text-center">
                      <button
                        onClick={() => handleDelete(record.id!)}
                        className="px-2 py-1 bg-red-500 text-white rounded flex items-center justify-center mx-auto"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span className="hidden sm:inline ml-1">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Cards for small screens */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="border rounded p-4 flex flex-col space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{record.date}</p>
                      <p>
                        {record.startTime} - {record.endTime}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(record.id!)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {record.comments && (
                    <p className="text-gray-700">{record.comments}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p>No records found.</p>
        )}
      </div>
    </main>
  );
}
