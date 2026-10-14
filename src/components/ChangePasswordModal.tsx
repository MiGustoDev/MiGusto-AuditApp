import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, AlertCircle, X } from 'lucide-react';
import { updateUserPassword, UserProfile } from '../lib/auth';

interface ChangePasswordModalProps {
  currentUser: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  currentUser,
  isOpen,
  onClose,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las nuevas contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await updateUserPassword(
        currentUser.email,
        currentPassword,
        newPassword
      );

      setIsLoading(false);

      if (res.success) {
        setSuccessMsg('¡Contraseña actualizada con éxito!');
        setTimeout(() => {
          onClose();
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg('');
        }, 1200);
      } else {
        setErrorMsg(res.error || 'No se pudo actualizar la contraseña.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Ocurrió un error inesperado al guardar la contraseña.');
    }
  };

  return (
    <div className="change-pwd-backdrop" role="dialog" aria-modal="true">
      <div className="change-pwd-card">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="change-pwd-close-btn"
          aria-label="Cerrar modal"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="change-pwd-header">
          <div className="change-pwd-icon-wrap">
            <Lock size={22} />
          </div>
          <div className="min-w-0">
            <h3 className="change-pwd-title">Cambiar contraseña</h3>
            <p className="change-pwd-subtitle">
              {currentUser.name} ({currentUser.email})
            </p>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="change-pwd-alert error">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="change-pwd-alert success">
            <Check size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="change-pwd-form">
          {/* Current Password */}
          <div className="change-pwd-field">
            <label className="change-pwd-label">
              Contraseña Actual
            </label>
            <div className="change-pwd-input-wrap">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresá tu contraseña actual"
                className="change-pwd-input"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="change-pwd-eye-btn"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="change-pwd-field">
            <label className="change-pwd-label">
              Nueva Contraseña
            </label>
            <div className="change-pwd-input-wrap">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="change-pwd-input"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="change-pwd-eye-btn"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="change-pwd-field">
            <label className="change-pwd-label">
              Confirmar Nueva Contraseña
            </label>
            <div className="change-pwd-input-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí la nueva contraseña"
                className="change-pwd-input"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="change-pwd-eye-btn"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="change-pwd-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="change-pwd-btn-cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="change-pwd-btn-submit"
            >
              {isLoading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
