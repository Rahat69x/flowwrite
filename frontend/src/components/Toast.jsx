import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const icons = {
    success: <CheckCircle2 size={18} color="#16a34a" />,
    error: <AlertCircle size={18} color="#dc2626" />,
    info: <Info size={18} color="#2563eb" />,
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
        padding: '12px 18px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-medium)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 2000,
        maxWidth: 380,
        animation: 'slideIn 0.2s ease-out',
      }}
    >
      {icons[type] || icons.info}
      <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{ color: 'var(--text-muted)', display: 'flex', padding: 2 }}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
