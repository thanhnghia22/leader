import React, { useState, useRef } from 'react';
import { Menu, LogOut, User, Camera, Upload, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';
import { Modal } from './Modal';
import authService from '../services/authService';
import './Header.css';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80';

const AVATAR_PRESETS = [
  {
    id: 'preset-1',
    name: 'Quản lý 3D Hiện đại',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'preset-2',
    name: 'Quản lý Nam lịch lãm',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'preset-3',
    name: 'Quản lý Nam trẻ trung',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'preset-4',
    name: 'Quản lý Nam công sở',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'preset-5',
    name: 'Quản lý Nữ thanh lịch',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'preset-6',
    name: 'Quản lý Nữ năng động',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
  },
];

function getInitials(name) {
  if (!name) return 'HM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Header({ onToggleSidebar, isSidebarCollapsed }) {
  const { user, logout, updateUser } = useAuth();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
  const formattedToday = today.toLocaleDateString('vi-VN', options);

  const displayAvatar = user?.avatar || DEFAULT_AVATAR;

  const handleOpenModal = () => {
    setPreviewAvatar(displayAvatar);
    setIsModalOpen(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WebP)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const base64Data = canvas.toDataURL('image/jpeg', 0.85);
        setPreviewAvatar(base64Data);
        addToast('Đã tải ảnh lên! Bấm "Lưu thay đổi" để áp dụng.', 'info');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveAvatar = async () => {
    try {
      setIsSaving(true);
      const username = user?.username || 'leader01';
      await authService.updateAvatar(username, previewAvatar);
      if (updateUser) {
        updateUser({ avatar: previewAvatar });
      }
      addToast('Cập nhật ảnh đại diện thành công!', 'success');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Lỗi lưu avatar:', err);
      if (updateUser) {
        updateUser({ avatar: previewAvatar });
      }
      addToast('Đã lưu ảnh đại diện trên thiết bị của bạn', 'success');
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <header className="top-header">
        <div className="header-left">
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
            title="Thu gọn / Mở rộng thanh điều hướng"
          >
            <Menu size={20} />
          </button>
          <div className="header-date">
            <span className="date-badge">Hôm nay: {formattedToday}</span>
          </div>
        </div>

        <div className="header-right">
          {/* Profile & Avatar */}
          <div
            className="user-profile cursor-pointer"
            onClick={handleOpenModal}
            title="Nhấp để đổi ảnh đại diện của Leader"
          >
            <div className="user-avatar-wrapper">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={user?.name || 'Leader'}
                  className="user-avatar-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="user-avatar-initials">
                  {getInitials(user?.name || 'Hòa Không Móc')}
                </div>
              )}
              <div className="user-avatar-badge" title="Đổi ảnh đại diện">
                <Camera size={11} />
              </div>
            </div>

            <div className="user-info">
              <span className="user-name">{user?.name || 'Hòa Không Móc'}</span>
              <span className="user-role">Quản lý</span>
            </div>
          </div>

          <button
            type="button"
            className="header-logout-btn"
            onClick={logout}
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <LogOut size={18} />
            <span className="logout-text">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Modal Đổi Avatar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ảnh đại diện Quản lý"
        size="md"
        footer={
          <div className="avatar-modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveAvatar}
              disabled={isSaving}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        }
      >
        <div className="avatar-modal-content">
          {/* Live Preview */}
          <div className="avatar-preview-section">
            <div className="avatar-preview-circle">
              {previewAvatar ? (
                <img src={previewAvatar} alt="Xem trước" className="avatar-preview-img" />
              ) : (
                <div className="avatar-preview-initials">
                  {getInitials(user?.name || 'Hòa Không Móc')}
                </div>
              )}
            </div>
            <div className="avatar-preview-info">
              <h4 className="avatar-preview-name">{user?.name || 'Hòa Không Móc'}</h4>
              <p className="avatar-preview-sub">Quản trị viên / Leader</p>
            </div>
          </div>

          {/* Upload Button */}
          <div className="avatar-upload-box">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button
              type="button"
              className="btn-upload-avatar"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} />
              <span>Tải ảnh mới từ máy tính của bạn</span>
            </button>
            <span className="avatar-upload-hint">Hỗ trợ định dạng PNG, JPG, WebP</span>
          </div>

          {/* Presets */}
          <div className="avatar-presets-section">
            <div className="avatar-presets-title">
              <Sparkles size={16} />
              <span>Hoặc chọn ảnh mẫu có sẵn:</span>
            </div>
            <div className="avatar-presets-grid">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = previewAvatar === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`preset-item ${isSelected ? 'preset-selected' : ''}`}
                    onClick={() => setPreviewAvatar(preset.url)}
                    title={preset.name}
                  >
                    <img src={preset.url} alt={preset.name} className="preset-img" />
                    {isSelected && (
                      <div className="preset-check">
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default Header;
