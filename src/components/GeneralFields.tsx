import React, { useState } from 'react';
import { AuditFields } from '../types/audit';
import { Store, User, Calendar, Users, ShoppingBag, Briefcase, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface GeneralFieldsProps {
  fields: AuditFields;
  onFieldChange: (field: keyof AuditFields, value: string) => void;
}

export const GeneralFields: React.FC<GeneralFieldsProps> = ({ fields, onFieldChange }) => {
  // If tienda is filled, start collapsed to save space and avoid scroll, but let user toggle easily
  const isFilled = Boolean(fields.f_tienda.trim() && fields.f_auditor.trim());
  const [isExpanded, setIsExpanded] = useState<boolean>(!isFilled);

  return (
    <section className="general-card card" aria-label="Datos generales">
      <div 
        className="general-header" 
        onClick={() => setIsExpanded(prev => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsExpanded(prev => !prev);
          }
        }}
      >
        <div className="general-summary">
          <div className="summary-main">
            <Store size={18} className="icon-accent" />
            <span className="summary-title">
              {fields.f_tienda ? fields.f_tienda : 'Completar datos del local'}
            </span>
          </div>

          <div className="summary-chips">
            {fields.f_auditor && (
              <span className="info-chip">
                <User size={13} /> {fields.f_auditor}
              </span>
            )}
            {fields.f_fecha && (
              <span className="info-chip">
                <Calendar size={13} /> {fields.f_fecha}
              </span>
            )}
            {fields.f_cargo && (
              <span className="info-chip">
                <Briefcase size={13} /> {fields.f_cargo}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="toggle-expand-btn"
          aria-label={isExpanded ? 'Contraer datos' : 'Expandir datos'}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(prev => !prev);
          }}
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div className="general-form-body animate-fade-in">
          <div className="fields-grid">
            <div className="field-group">
              <label htmlFor="f_tienda">
                <Store size={15} />
                <span>Tienda / Sucursal *</span>
              </label>
              <input
                id="f_tienda"
                type="text"
                autoComplete="off"
                value={fields.f_tienda}
                onChange={e => onFieldChange('f_tienda', e.target.value)}
                placeholder="Ej. Sucursal Palermo"
                className={!fields.f_tienda ? 'required-highlight' : ''}
              />
            </div>

            <div className="field-group">
              <label htmlFor="f_auditor">
                <User size={15} />
                <span>Auditor/a *</span>
              </label>
              <input
                id="f_auditor"
                type="text"
                autoComplete="name"
                value={fields.f_auditor}
                onChange={e => onFieldChange('f_auditor', e.target.value)}
                placeholder="Nombre y apellido"
                className={!fields.f_auditor ? 'required-highlight' : ''}
              />
            </div>

            <div className="field-group">
              <label htmlFor="f_fecha">
                <Calendar size={15} />
                <span>Fecha de auditoría</span>
              </label>
              <input
                id="f_fecha"
                type="date"
                value={fields.f_fecha}
                onChange={e => onFieldChange('f_fecha', e.target.value)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="f_cargo">
                <Briefcase size={15} />
                <span>Personal a cargo</span>
              </label>
              <input
                id="f_cargo"
                type="text"
                autoComplete="off"
                value={fields.f_cargo}
                onChange={e => onFieldChange('f_cargo', e.target.value)}
                placeholder="Encargado/a de turno"
              />
            </div>

            <div className="field-group">
              <label htmlFor="f_colab">
                <Users size={15} />
                <span>Colaboradores presentes</span>
              </label>
              <input
                id="f_colab"
                type="number"
                inputMode="numeric"
                min="0"
                value={fields.f_colab}
                onChange={e => onFieldChange('f_colab', e.target.value)}
                placeholder="Cantidad de colaboradores"
              />
            </div>

            <div className="field-group">
              <label htmlFor="f_unid">
                <ShoppingBag size={15} />
                <span>Unidades vendidas</span>
              </label>
              <input
                id="f_unid"
                type="number"
                inputMode="numeric"
                min="0"
                value={fields.f_unid}
                onChange={e => onFieldChange('f_unid', e.target.value)}
                placeholder="Cantidad de unidades"
              />
            </div>
          </div>

          <div className="general-form-footer">
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setIsExpanded(false)}
            >
              <CheckCircle2 size={15} /> Listo, ocultar panel
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
