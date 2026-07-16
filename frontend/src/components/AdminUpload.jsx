import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';

const AdminUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError("Only Excel workbook sheets (.xlsx, .xls) are allowed.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setSuccess('');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an Excel workbook first.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess(`Successfully imported ${response.data.metrics_count} metrics from ${response.data.filename}!`);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Excel upload failed. Ensure the tabs match standard schemas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <span className="chart-subtitle">Configuration</span>
          <h3>Upload Monthly Excel Report</h3>
        </div>
      </div>
      
      {error && (
        <div className="error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="feedback-banner">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleUploadSubmit}>
        <div 
          className="upload-area"
          onClick={() => document.getElementById('excelFileInput').click()}
        >
          <UploadCloud className="upload-icon" />
          {file ? (
            <div>
              <p style={{ fontWeight: '600', color: 'var(--secondary)' }}>{file.name}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(1)} KB | Click to change
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontWeight: '600', color: 'var(--secondary)' }}>
                Drag & Drop or Click to Select File
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Supports Microsoft Excel Workbooks (.xlsx, .xls)
              </p>
            </div>
          )}
          <input
            id="excelFileInput"
            type="file"
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
          disabled={loading || !file}
        >
          {loading ? 'Uploading & Parsing...' : 'Process Excel Workbook'}
        </button>
      </form>
    </div>
  );
};

export default AdminUpload;
