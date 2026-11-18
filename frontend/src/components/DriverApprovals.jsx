import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Shield, 
  User, 
  Copy, 
  Printer, 
  RefreshCw, 
  FileText, 
  AlertCircle, 
  Check, 
  Ban,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

const API_BASE = "http://localhost:8000";

export default function DriverApprovals({ isOpen, onClose, token }) {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'generate'
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending', 'all'

  // Generate QR state
  const [agency, setAgency] = useState('108 GVK-EMRI Ambulance Service');
  const [expiresHours, setExpiresHours] = useState(48);
  const [maxUses, setMaxUses] = useState(1);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Review action modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [allowedVehicles, setAllowedVehicles] = useState(['ambulance']);
  const [docImageBlobUrl, setDocImageBlobUrl] = useState(null);
  const [docImageLoading, setDocImageLoading] = useState(false);

  const authToken = token || localStorage.getItem('lifelane_token');

  // Load licence document image with authentication & query token fallback
  useEffect(() => {
    if (!selectedReg?.id) {
      setDocImageBlobUrl(null);
      return;
    }
    let active = true;
    setDocImageLoading(true);

    const imageUrl = `${API_BASE}/api/v1/registration/${selectedReg.id}/image?token=${encodeURIComponent(authToken || '')}`;
    fetch(imageUrl, {
      headers: authToken ? { "Authorization": `Bearer ${authToken}` } : {}
    })
      .then(res => {
        if (!res.ok) throw new Error("Image load HTTP " + res.status);
        return res.blob();
      })
      .then(blob => {
        if (active) {
          const url = URL.createObjectURL(blob);
          setDocImageBlobUrl(url);
          setDocImageLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          // Direct URL fallback
          setDocImageBlobUrl(imageUrl);
          setDocImageLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedReg?.id, authToken]);

  // Fetch queue
  const fetchQueue = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/registration/queue?status_filter=${filterStatus}`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        if (data.length > 0 && !selectedReg) {
          setSelectedReg(data[0]);
        }
      }
    } catch (err) {
      console.error("Queue fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQueue();
    }
  }, [isOpen, filterStatus]);

  // Generate Token & QR
  const handleGenerateToken = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/registration/tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          agency,
          expires_hours: parseInt(expiresHours),
          max_uses: parseInt(maxUses)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedToken(data);
      }
    } catch (err) {
      alert("Error generating token: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Approve
  const handleApprove = async () => {
    if (!selectedReg) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/registration/${selectedReg.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ allowed_vehicle_types: allowedVehicles })
      });
      if (res.ok) {
        await fetchQueue();
        setSelectedReg((prev) => prev ? { ...prev, status: 'approved' } : null);
      }
    } catch (err) {
      alert("Approve error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject
  const handleReject = async () => {
    if (!selectedReg || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/registration/${selectedReg.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.ok) {
        setRejectModalOpen(false);
        setRejectReason('');
        await fetchQueue();
        setSelectedReg((prev) => prev ? { ...prev, status: 'rejected' } : null);
      }
    } catch (err) {
      alert("Reject error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Suspend
  const handleSuspend = async () => {
    if (!selectedReg) return;
    const reason = prompt("Enter mandatory reason for emergency driver credential suspension:");
    if (!reason || !reason.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/registration/${selectedReg.id}/suspend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        await fetchQueue();
        setSelectedReg((prev) => prev ? { ...prev, status: 'suspended' } : null);
      }
    } catch (err) {
      alert("Suspend error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const copyRegistrationUrl = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken.registration_url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const printQrCode = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>LifeLane Driver Registration QR - ${agency}</title></head>
        <body style="font-family:sans-serif; text-align:center; padding: 40px;">
          <h2>LifeLane AI — Driver Authorization Token</h2>
          <p>Agency: <strong>${agency}</strong></p>
          <img src="${generatedToken.qr_code_data_url}" style="width: 260px; height: 260px;" />
          <p style="font-family:monospace; font-size:12px;">${generatedToken.registration_url}</p>
          <p style="font-size:11px; color:#666;">Expires: ${new Date(generatedToken.expires_at).toLocaleString()}</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e0e1e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8f8f8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              backgroundColor: '#f36e20',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Shield size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#3a3b3a', margin: 0 }}>
                Police Command · Driver Approvals & QR Dispatch
              </h2>
              <div style={{ fontSize: '12px', color: '#626462' }}>
                G6 Anti-Spoofing & Automated Consistency Review Console
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', backgroundColor: '#e0e1e0', borderRadius: '10px', padding: '3px' }}>
              <button
                onClick={() => setActiveTab('queue')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'queue' ? '#ffffff' : 'transparent',
                  color: activeTab === 'queue' ? '#3a3b3a' : '#626462'
                }}
              >
                Review Queue ({queue.length})
              </button>
              <button
                onClick={() => setActiveTab('generate')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'generate' ? '#ffffff' : 'transparent',
                  color: activeTab === 'generate' ? '#3a3b3a' : '#626462'
                }}
              >
                Generate QR Token
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#626462',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Mandatory Honesty Notice Banner */}
        <div style={{
          backgroundColor: '#eff6ff',
          borderBottom: '1px solid #bfdbfe',
          padding: '10px 24px',
          fontSize: '12px',
          color: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>Mandatory Human Verification Notice:</strong> Automated extraction only — not proof of authenticity. Verify against official transport records before granting emergency green corridor preemption.
          </span>
        </div>

        {/* Main Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {activeTab === 'generate' ? (
            /* Generate QR Tab */
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#3a3b3a', margin: '0 0 4px 0' }}>
                  Issue New Registration QR Code
                </h3>
                <p style={{ fontSize: '13px', color: '#626462', margin: 0 }}>
                  Create an encrypted, time-limited token for emergency ambulance or fire drivers.
                </p>
              </div>

              <form onSubmit={handleGenerateToken} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#3a3b3a', marginBottom: '4px' }}>
                    Emergency Agency
                  </label>
                  <input
                    type="text"
                    required
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e0e1e0',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#3a3b3a', marginBottom: '4px' }}>
                      Token Validity Window
                    </label>
                    <select
                      value={expiresHours}
                      onChange={(e) => setExpiresHours(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e0e1e0',
                        fontSize: '13px',
                        backgroundColor: '#fff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value={12}>12 Hours</option>
                      <option value={24}>24 Hours</option>
                      <option value={48}>48 Hours (Standard)</option>
                      <option value={168}>7 Days</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#3a3b3a', marginBottom: '4px' }}>
                      Max Registrations
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e0e1e0',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#f36e20',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: generating ? 'wait' : 'pointer'
                  }}
                >
                  {generating ? 'Generating QR Code...' : 'Generate Driver Onboarding QR'}
                </button>
              </form>

              {generatedToken && (
                <div style={{
                  marginTop: '24px',
                  backgroundColor: '#f8f8f8',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid #e0e1e0',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e0e1e0',
                    marginBottom: '14px'
                  }}>
                    <img 
                      src={generatedToken.qr_code_data_url} 
                      alt="Registration QR Code"
                      style={{ width: '200px', height: '200px', display: 'block' }}
                    />
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#3a3b3a', marginBottom: '4px' }}>
                    {generatedToken.agency}
                  </div>
                  <div style={{ fontSize: '11px', color: '#626462', marginBottom: '14px' }}>
                    Expires: {new Date(generatedToken.expires_at).toLocaleString()} · Single-use token
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={copyRegistrationUrl}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e0e1e0',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Copy size={14} />
                      <span>{copySuccess ? 'Copied Link!' : 'Copy Link'}</span>
                    </button>

                    <button
                      onClick={printQrCode}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e0e1e0',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Printer size={14} />
                      <span>Print QR Badge</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Review Queue Tab */
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', height: '100%' }}>
              {/* Left Column: Applications List */}
              <div style={{ borderRight: '1px solid #e0e1e0', paddingRight: '16px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #e0e1e0',
                      fontSize: '12px',
                      backgroundColor: '#fff',
                      fontWeight: '600'
                    }}
                  >
                    <option value="pending">Pending Review</option>
                    <option value="all">All Registrations</option>
                  </select>

                  <button
                    onClick={fetchQueue}
                    title="Refresh Queue"
                    style={{ background: 'none', border: 'none', color: '#626462', cursor: 'pointer' }}
                  >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {queue.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '13px' }}>
                      No applications matching filter.
                    </div>
                  ) : (
                    queue.map((reg) => (
                      <div
                        key={reg.id}
                        onClick={() => setSelectedReg(reg)}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: selectedReg?.id === reg.id ? '2px solid #f36e20' : '1px solid #e0e1e0',
                          backgroundColor: selectedReg?.id === reg.id ? '#fef2ec' : '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '700', fontSize: '13px', color: '#3a3b3a' }}>
                            {reg.full_name}
                          </span>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '800',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            backgroundColor: reg.status === 'approved' ? '#ecfdf5' : (reg.status === 'pending' ? '#fef3c7' : '#fef2f2'),
                            color: reg.status === 'approved' ? '#059669' : (reg.status === 'pending' ? '#d97706' : '#dc2626')
                          }}>
                            {reg.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#626462', marginBottom: '2px' }}>
                          {reg.licence_number_normalized}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {reg.agency}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Selected Application Review Detail */}
              {selectedReg ? (
                <div style={{ overflowY: 'auto', paddingRight: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#3a3b3a', margin: '0 0 2px 0' }}>
                        {selectedReg.full_name}
                      </h3>
                      <div style={{ fontSize: '12px', color: '#626462' }}>
                        Licence: <strong>{selectedReg.licence_number_normalized}</strong> · Agency: {selectedReg.agency}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {selectedReg.status !== 'approved' && (
                        <button
                          onClick={handleApprove}
                          disabled={actionLoading}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Check size={14} />
                          <span>Approve Driver</span>
                        </button>
                      )}

                      {selectedReg.status === 'approved' && (
                        <button
                          onClick={handleSuspend}
                          disabled={actionLoading}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#f59e0b',
                            color: '#fff',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Ban size={14} />
                          <span>Suspend</span>
                        </button>
                      )}

                      {selectedReg.status !== 'rejected' && (
                        <button
                          onClick={() => setRejectModalOpen(true)}
                          disabled={actionLoading}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Two-pane: Document Image vs Extracted Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    {/* Document Image */}
                    <div style={{
                      border: '1px solid #e0e1e0',
                      borderRadius: '12px',
                      padding: '12px',
                      backgroundColor: '#f8f8f8',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#626462', marginBottom: '8px', textAlign: 'left' }}>
                        SUBMITTED LICENCE DOCUMENT
                      </div>
                      {docImageLoading ? (
                        <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#626462', fontSize: '12px' }}>
                          <RefreshCw className="animate-spin" size={18} style={{ marginRight: '6px' }} /> Loading licence image...
                        </div>
                      ) : docImageBlobUrl ? (
                        <img 
                          src={docImageBlobUrl}
                          alt="Licence Document"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '220px',
                            borderRadius: '8px',
                            border: '1px solid #e0e1e0',
                            objectFit: 'contain',
                            backgroundColor: '#ffffff'
                          }}
                        />
                      ) : (
                        <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>
                          No document preview available
                        </div>
                      )}
                    </div>

                    {/* Extracted Fields */}
                    <div style={{
                      border: '1px solid #e0e1e0',
                      borderRadius: '12px',
                      padding: '14px',
                      backgroundColor: '#ffffff'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#626462' }}>
                          AUTOMATED EXTRACTION DATA
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb'
                        }}>
                          Confidence: {selectedReg.ocr_confidence.toFixed(0)}%
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: '#94a3b8' }}>Extracted Name: </span>
                          <strong>{selectedReg.ocr_extracted?.name || "Not extracted"}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8' }}>Licence Number: </span>
                          <strong>{selectedReg.ocr_extracted?.licence_number || "Not extracted"}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8' }}>Date of Birth: </span>
                          <strong>{selectedReg.ocr_extracted?.date_of_birth || "Not extracted"}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8' }}>Issue Date: </span>
                          <strong>{selectedReg.ocr_extracted?.issue_date || "Not extracted"}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8' }}>Validity Expiry: </span>
                          <strong>{selectedReg.ocr_extracted?.expiry_date || "Not extracted"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Consistency Flags */}
                  <div style={{
                    border: '1px solid #e0e1e0',
                    borderRadius: '12px',
                    padding: '14px',
                    backgroundColor: '#ffffff',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#626462', marginBottom: '8px' }}>
                      AUTOMATED CONSISTENCY CHECKS & FLAGS
                    </div>
                    {selectedReg.flags && selectedReg.flags.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedReg.flags.map((flag, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: flag.severity === 'critical' ? '#fef2f2' : (flag.severity === 'warning' ? '#fffbeb' : '#f0fdf4'),
                              border: flag.severity === 'critical' ? '1px solid #fecaca' : (flag.severity === 'warning' ? '1px solid #fde68a' : '1px solid #bbf7d0'),
                              color: flag.severity === 'critical' ? '#b91c1c' : (flag.severity === 'warning' ? '#b45309' : '#15803d')
                            }}
                          >
                            <span style={{ fontWeight: '800', fontSize: '10px', textTransform: 'uppercase' }}>
                              [{flag.code}]
                            </span>
                            <span>{flag.message}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} />
                        <span>No automated inconsistency flags raised.</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                  Select an application from the queue to view documents and consistency checks.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rejection Modal with Mandatory Reason */}
        {rejectModalOpen && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 210
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#3a3b3a', margin: '0 0 8px 0' }}>
                Reject Driver Registration
              </h3>
              <p style={{ fontSize: '12px', color: '#626462', margin: '0 0 14px 0' }}>
                A documented justification reason is required for municipal audit integrity.
              </p>
              <textarea
                required
                rows={3}
                placeholder="e.g. Expired driving licence document, image unreadable, or details mismatch with official RTO database."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e0e1e0',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  marginBottom: '14px'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#e0e1e0',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
