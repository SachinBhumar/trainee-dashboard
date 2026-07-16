import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, CheckCircle, AlertTriangle, Copy, Check } from 'lucide-react';

const AdminInvite = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setInviteUrl('');
    setCopied(false);

    try {
      const response = await axios.post('/api/admin/create-invite', {
        email,
        role
      });
      setInviteUrl(response.data.invite_url);
      setEmail('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Could not generate invite token.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <span className="chart-subtitle">Security</span>
          <h3>Generate Member Invite Link</h3>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleInviteSubmit}>
        <div className="form-group">
          <label htmlFor="inviteEmail">Teammate Email Address</label>
          <input
            id="inviteEmail"
            type="email"
            required
            className="input-field"
            placeholder="teammate@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="inviteRole">User Permissions Role</label>
          <select
            id="inviteRole"
            className="select-filter"
            style={{ width: '100%', height: '45px', borderRadius: 'var(--radius-md)' }}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
          >
            <option value="member">Member (Read-Only + Exports)</option>
            <option value="admin">Administrator (Upload + Admin settings)</option>
          </select>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={loading || !email}
        >
          <UserPlus size={18} />
          {loading ? 'Creating Invitation...' : 'Create Invite Link'}
        </button>
      </form>

      {inviteUrl && (
        <div className="invite-result">
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--secondary)' }}>
            Invite Created Successfully!
          </span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Send this registration link to your colleague:
          </p>
          <div className="invite-link-box">
            <input 
              type="text" 
              readOnly 
              className="invite-input" 
              value={inviteUrl} 
              onClick={(e) => e.target.select()}
            />
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 12px' }}
              onClick={handleCopyToClipboard}
            >
              {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
            </button>
          </div>
          <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: 'rgba(255, 193, 7, 0.1)', borderLeft: '3px solid #ffc107', borderRadius: '4px', fontSize: '0.75rem', color: '#856404' }}>
            <strong>Note:</strong> To test this link yourself, please log out first or open the link in an <strong>Incognito / Private Window</strong>. If you open it in this session, you will be automatically redirected to the dashboard.
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvite;
