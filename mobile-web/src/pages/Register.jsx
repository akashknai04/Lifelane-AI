import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  QrCode, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  Upload, 
  CheckCircle2, 
  FileText, 
  Camera, 
  Building, 
  Lock, 
  User, 
  CreditCard,
  Clock
} from 'lucide-react';
import { API_BASE } from '../config';

export default function Register() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t');

  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [agency, setAgency] = useState(null);

  const [fullName, setFullName] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenLoading(false);
      setTokenError("No registration token provided in link. Please scan the QR code issued by your authority.");
      return;
    }

    async function verifyToken() {
      setTokenLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/registration/tokens/${encodeURIComponent(token)}/check`);
        const data = await res.json();
        if (data.valid) {
          setTokenValid(true);
          setAgency(data.agency || "Municipal Emergency Response Command");
        } else {
          setTokenValid(false);
          setTokenError(data.message || "Invalid or expired registration token.");
        }
      } catch (err) {
        setTokenValid(false);
        setTokenError("Could not reach municipal authentication gateway to verify token.");
      } finally {
        setTokenLoading(false);
      }
    }
    verifyToken();
  }, [token]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setSubmitError("Only JPEG and PNG licence images are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Document image size must be under 5 MB.");
      return;
    }

    setSubmitError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setSubmitError("Please upload or photograph your driving licence document.");
      return;
    }
    if (!consent) {
      setSubmitError("Consent is required to process your application.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('licence_number', licenceNumber);
    formData.append('password', password);
    formData.append('consent', consent ? 'true' : 'false');
    formData.append('token', token);
    formData.append('licence_image', selectedFile);

    try {
      const res = await fetch(`${API_BASE}/api/v1/registration/submit`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Submission failed with status ${res.status}`);
      }

      const resData = await res.json();
      setSubmitSuccess(resData);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit registration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px 20px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '460px', width: '100%', margin: '0 auto' }}>
        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#94a3b8',
            fontSize: '12px',
            textDecoration: 'none',
            marginBottom: '16px'
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Sign In</span>
        </Link>

        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #334155',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}>
          {tokenLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <Clock size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#f36e20' }} />
              <div>Verifying municipal registration token...</div>
            </div>
          ) : !tokenValid ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                marginBottom: '16px'
              }}>
                <AlertCircle size={36} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0' }}>
                Invalid or Expired Token
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
                {tokenError}
              </p>
              <div style={{
                backgroundColor: '#0f172a',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#cbd5e1',
                textAlign: 'left',
                border: '1px solid #334155',
                marginBottom: '20px'
              }}>
                <strong>How to obtain a valid token:</strong> Contact your emergency fleet dispatch supervisor or the municipal traffic police command center. They will issue a signed, one-time QR code.
              </div>
              <Link
                to="/login"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#334155',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              >
                Return to Login
              </Link>
            </div>
          ) : submitSuccess ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                marginBottom: '16px'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px 0', color: '#10b981' }}>
                Application Submitted
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
                Awaiting Authority Review
              </p>

              <div style={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #334155',
                textAlign: 'left',
                fontSize: '12px',
                color: '#cbd5e1',
                marginBottom: '20px'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Assigned Username:</strong> <code style={{ color: '#f36e20', fontWeight: '700' }}>{submitSuccess.assigned_username}</code>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Agency:</strong> {agency}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
                  Your licence image has been queued for automated consistency extraction. A police or municipal transit reviewer must approve your credentials before your account can activate emergency corridor preemption.
                </div>
              </div>

              <Link
                to="/login"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#f36e20',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <div>
              {/* Token Valid Banner */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px'
              }}>
                <Building size={12} />
                <span>{agency}</span>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>
                Driver Registration
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
                Submit your official driving licence for automated extraction and authority review.
              </p>

              {submitError && (
                <div style={{
                  backgroundColor: '#451a1a',
                  border: '1px solid #7f1d1d',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#fca5a5'
                }}>
                  <AlertCircle size={16} />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Full Legal Name (as on licence)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: '10px',
                        border: '1px solid #334155',
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <User size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Licence Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      autoCapitalize="characters"
                      placeholder="e.g. KA0120180004567"
                      value={licenceNumber}
                      onChange={(e) => setLicenceNumber(e.target.value.toUpperCase())}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: '10px',
                        border: '1px solid #334155',
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <CreditCard size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Create Account Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: '10px',
                        border: '1px solid #334155',
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Lock size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  </div>
                </div>

                {/* File Upload / Camera Capture */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Licence Document Image (JPEG/PNG, Max 5MB)
                  </label>
                  <div style={{
                    border: '1px dashed #475569',
                    borderRadius: '12px',
                    padding: '16px',
                    backgroundColor: '#0f172a',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="file"
                      id="licence_file_input"
                      accept="image/jpeg,image/png"
                      capture="environment"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="licence_file_input" style={{ cursor: 'pointer', display: 'block' }}>
                      {filePreview ? (
                        <div>
                          <img 
                            src={filePreview} 
                            alt="Licence preview" 
                            style={{ maxHeight: '120px', borderRadius: '8px', margin: '0 auto 8px auto', display: 'block' }}
                          />
                          <div style={{ fontSize: '11px', color: '#38bdf8' }}>Change document image</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', color: '#f36e20', marginBottom: '6px' }}>
                            <Camera size={22} />
                            <Upload size={22} />
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#f8fafc' }}>
                            Tap to capture or upload licence
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            Take a clear, well-lit photo of the physical licence card.
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div style={{
                  backgroundColor: '#0f172a',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <input
                    type="checkbox"
                    id="consent_check"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: '#f36e20' }}
                  />
                  <label htmlFor="consent_check" style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, cursor: 'pointer' }}>
                    I consent to municipal traffic authorities processing this document for emergency response authorization. Automated extraction assists review; all final decisions are made by municipal reviewers. Rejected documents are automatically purged after 30 days.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: '6px',
                    width: '100%',
                    padding: '13px',
                    borderRadius: '10px',
                    backgroundColor: '#f36e20',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: submitting ? 'wait' : 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Submitting Application...' : 'Submit for Operator Review'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>G6 Protected · G5 PII Retention Compliant</span>
        </div>
      </div>
    </div>
  );
}
