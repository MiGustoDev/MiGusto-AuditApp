import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { SavedAuditRecord } from '../types/audit';
import { CustomDatePicker } from './CustomDatePicker';
import { generateRecordSummaryText, fmtDate } from '../utils/formatters';
import { 
  X, 
  Store, 
  User, 
  Calendar, 
  Briefcase, 
  Users, 
  ShoppingBag, 
  Check, 
  Pencil, 
  AlertCircle 
} from 'lucide-react';

interface EditAuditModalProps {
  record: SavedAuditRecord | null;
  initialTab?: 'general' | 'operational';
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRecord: SavedAuditRecord) => Promise<{ ok: boolean; error?: string; id?: string }>;
  onFlashMessage?: (msg: string, isErr?: boolean) => void;
}

export const EditAuditModal: React.FC<EditAuditModalProps> = ({
  record,
  initialTab = 'general',
  isOpen,
  onClose,
  onSave,
  onFlashMessage
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'operational'>(initialTab);
  const [tienda, setTienda] = useState('');
  const [fecha, setFecha] = useState('');
  const [auditor, setAuditor] = useState('');
  const [personalACargo, setPersonalACargo] = useState('');
  const [colaboradores, setColaboradores] = useState('');
  const [unidades, setUnidades] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync state when record or open changes
  useEffect(() => {
    if (record && isOpen) {
      setTienda(record.tienda || '');
      setFecha(record.fecha || '');
      setAuditor(record.auditor || '');
      setPersonalACargo(record.personalACargo || '');
      setColaboradores(record.colaboradores || '');
      setUnidades(record.unidades || '');
      setActiveTab(initialTab);
      setError(null);
    }
  }, [record, isOpen, initialTab]);

  // Animate modal entry
  useEffect(() => {
    if (isOpen && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.95, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tienda.trim()) {
      setError('Por favor ingresá el nombre de la sucursal.');
      setActiveTab('general');
      return;
    }

    if (!auditor.trim()) {
      setError('Por favor ingresá el nombre del auditor.');
      setActiveTab('general');
      return;
    }

    if (!fecha.trim()) {
      setError('Por favor seleccioná una fecha válida.');
      setActiveTab('general');
      return;
    }

    setIsSaving(true);
    try {
      const updated: SavedAuditRecord = {
        ...record,
        tienda: tienda.trim(),
        fecha: fecha.trim(),
        auditor: auditor.trim(),
        personalACargo: personalACargo.trim(),
        colaboradores: colaboradores.trim(),
        unidades: unidades.trim()
      };

      // Recalculate text summary with updated fields
      updated.resumen = generateRecordSummaryText(updated);

      const res = await onSave(updated);
      if (res.ok) {
        onFlashMessage?.(`¡Auditoría de ${updated.tienda} actualizada con éxito!`);
        onClose();
      } else {
        setError(res.error || 'No se pudo guardar la modificación.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al actualizar el registro.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="edit-modal-backdrop"
      ref={modalRef}
      onClick={(e) => {
        if (e.target === modalRef.current && !isSaving) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-audit-title"
    >
      <div className="edit-modal-card card" ref={cardRef}>
        {/* Header */}
        <div className="edit-modal-header">
          <div className="edit-modal-title-col">
            <div className="edit-modal-badge">
              <Pencil size={14} />
              <span>Editar Registro</span>
            </div>
            <h3 id="edit-audit-title" className="edit-modal-heading">
              {record.tienda || 'Sucursal'}
            </h3>
            <p className="edit-modal-sub">
              {fmtDate(record.fecha)} · {record.auditMode === 'experience' ? '✨ Experience' : 'Normal'}
            </p>
          </div>
          <button 
            type="button" 
            className="edit-modal-close-btn"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cerrar ventana de edición"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="edit-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'general'}
            className={`edit-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Store size={15} />
            <span>Datos Principales</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'operational'}
            className={`edit-tab-btn ${activeTab === 'operational' ? 'active' : ''}`}
            onClick={() => setActiveTab('operational')}
          >
            <Users size={15} />
            <span>Datos Operativos</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="edit-modal-form">
          {error && (
            <div className="edit-modal-error-alert" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'general' ? (
            <div className="edit-fields-group">
              <div className="field-item">
                <label htmlFor="edit_tienda">
                  <Store size={14} className="field-icon" />
                  <span>Nombre de la Sucursal <span className="req-star">*</span></span>
                </label>
                <input
                  id="edit_tienda"
                  type="text"
                  value={tienda}
                  onChange={e => setTienda(e.target.value)}
                  placeholder="Ej. Caballito"
                  required
                  autoFocus
                />
              </div>

              <div className="field-item">
                <label htmlFor="edit_auditor">
                  <User size={14} className="field-icon" />
                  <span>Auditor/a Responsable <span className="req-star">*</span></span>
                </label>
                <input
                  id="edit_auditor"
                  type="text"
                  value={auditor}
                  onChange={e => setAuditor(e.target.value)}
                  placeholder="Ej. Damaris Burgos"
                  required
                />
              </div>

              <div className="field-item">
                <label>
                  <Calendar size={14} className="field-icon" />
                  <span>Fecha de la Auditoría <span className="req-star">*</span></span>
                </label>
                <CustomDatePicker
                  value={fecha}
                  onChange={val => setFecha(val)}
                />
              </div>
            </div>
          ) : (
            <div className="edit-fields-group">
              <div className="field-item">
                <label htmlFor="edit_cargo">
                  <Briefcase size={14} className="field-icon" />
                  <span>Personal a cargo</span>
                </label>
                <input
                  id="edit_cargo"
                  type="text"
                  value={personalACargo}
                  onChange={e => setPersonalACargo(e.target.value)}
                  placeholder="Ej. Encargado de turno"
                  autoFocus
                />
              </div>

              <div className="field-item">
                <label htmlFor="edit_colab">
                  <Users size={14} className="field-icon" />
                  <span>Cantidad de colaboradores</span>
                </label>
                <input
                  id="edit_colab"
                  type="text"
                  value={colaboradores}
                  onChange={e => setColaboradores(e.target.value)}
                  placeholder="Ej. 6"
                />
              </div>

              <div className="field-item">
                <label htmlFor="edit_unid">
                  <ShoppingBag size={14} className="field-icon" />
                  <span>Unidades vendidas</span>
                </label>
                <input
                  id="edit_unid"
                  type="text"
                  value={unidades}
                  onChange={e => setUnidades(e.target.value)}
                  placeholder="Ej. 1200"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="edit-modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSaving}
            >
              <span>Cancelar</span>
            </button>

            <button
              type="submit"
              className="btn btn-primary btn-save-edit"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-sm"></span>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Guardar cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
