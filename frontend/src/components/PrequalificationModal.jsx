import React, { useEffect, useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

/**
 * Reusable Prequalification Package request modal.
 * Submits to Netlify Forms (built-in, no backend) — Netlify auto-emails inbox@twofungis.ca.
 *
 * To enable in Netlify after first deploy:
 *   Netlify → Forms → "prequalification" → Notifications → Add email → inbox@twofungis.ca
 */
const PrequalificationModal = ({ open, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const encode = (data) =>
    Object.keys(data)
      .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
      .join('&');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode({ 'form-name': 'prequalification', ...data }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please email inbox@twofungis.ca directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeAndReset = () => {
    setSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      onClick={closeAndReset}
      data-testid="prequal-modal"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl my-8 sm:my-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeAndReset}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100"
          aria-label="Close"
          data-testid="prequal-close"
        >
          <X size={22} />
        </button>

        {submitted ? (
          <div className="p-8 sm:p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(34,139,34,0.12)' }}>
              <CheckCircle2 size={36} style={{ color: '#228B22' }} />
            </div>
            <h3 className="text-3xl font-bold text-black mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Thank you for your interest in Two Fungis Finishing.
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Your request has been received successfully. A member of our team will review your inquiry and forward our current Subcontractor Prequalification Package shortly.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              We appreciate the opportunity to connect and look forward to supporting your upcoming projects.
            </p>
            <button
              type="button"
              onClick={closeAndReset}
              className="text-white px-6 py-3 rounded-md font-semibold"
              style={{ backgroundColor: '#228B22' }}
              data-testid="prequal-done"
            >
              Close
            </button>
          </div>
        ) : (
          <form
            name="prequalification"
            method="POST"
            data-netlify="true"
            data-netlify-honeypot="bot-field"
            onSubmit={handleSubmit}
            className="p-6 sm:p-8"
          >
            {/* Netlify form discovery */}
            <input type="hidden" name="form-name" value="prequalification" />
            <p className="hidden">
              <label>Don&apos;t fill this out: <input name="bot-field" /></label>
            </p>

            <h3 className="text-3xl font-bold text-black mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Request Prequalification Package
            </h3>
            <p className="text-gray-600 text-sm mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Complete the form below and we&apos;ll send our current Subcontractor Prequalification Package directly to you.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name *"            name="fullName"  required testid="prequal-name" />
              <Field label="Company *"              name="company"   required testid="prequal-company" />
              <Field label="Position / Title *"     name="position"  required testid="prequal-position" />
              <Field label="Email Address *"        name="email"     required type="email" testid="prequal-email" />
              <Field label="Phone Number *"         name="phone"     required type="tel"   testid="prequal-phone" />
              <Field label="Project Name (optional)" name="projectName" testid="prequal-project" />
              <div className="sm:col-span-2">
                <Field label="City / Region *"      name="city"      required testid="prequal-city" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Open Sans, sans-serif' }}>Message</label>
                <textarea
                  name="message"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900"
                  data-testid="prequal-message"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm mt-4" data-testid="prequal-error">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full text-white px-6 py-3 rounded-md font-semibold transition-colors disabled:opacity-60"
              style={{ backgroundColor: '#228B22' }}
              onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#1e7b1e')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#228B22')}
              data-testid="prequal-submit"
            >
              {submitting ? 'Sending…' : 'Submit Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, name, type = 'text', required = false, testid }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Open Sans, sans-serif' }}>{label}</label>
    <input
      type={type}
      name={name}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900"
      data-testid={testid}
    />
  </div>
);

export default PrequalificationModal;
