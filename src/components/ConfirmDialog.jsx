import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận hành động',
  message = 'Bạn có chắc chắn muốn thực hiện thao tác này? Hành động không thể hoàn tác.',
  confirmText = 'Xác nhận xóa',
  cancelText = 'Hủy bỏ',
  variant = 'danger',
  loading = false
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            padding: '10px',
            borderRadius: '50%',
            backgroundColor: variant === 'danger' ? '#fee2e2' : '#fef3c7',
            color: variant === 'danger' ? '#dc2626' : '#d97706',
            flexShrink: 0
          }}
        >
          <AlertTriangle size={24} />
        </div>
        <div>
          <p style={{ color: '#475569', fontSize: '0.925rem', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
