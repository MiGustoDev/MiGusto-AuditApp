import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { AuditFields } from '../types/audit';
import { Store, User, Users, ShoppingBag, Briefcase } from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker';

interface GeneralFieldsProps {
  fields: AuditFields;
  onFieldChange: (field: keyof AuditFields, value: string) => void;
}

export const GeneralFields: React.FC<GeneralFieldsProps> = ({ fields, onFieldChange }) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.field-item'),
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <section ref={containerRef} className="general-card-inline card" aria-label="Datos del local">
      <div className="general-section-title-row">
        <span className="general-section-title">Datos del local</span>
      </div>

      <div className="fields-single-line">
        {/* 1. Tienda (Obligatorio) */}
        <div className="field-item">
          <label htmlFor="f_tienda">
            <Store size={14} className="field-icon" />
            <span>Tienda <span className="req-star">*</span></span>
          </label>
          <input
            id="f_tienda"
            type="text"
            autoComplete="off"
            value={fields.f_tienda}
            onChange={e => onFieldChange('f_tienda', e.target.value)}
            placeholder="Ej. Palermo"
          />
        </div>

        {/* 2. Auditor (Obligatorio) */}
        <div className="field-item">
          <label htmlFor="f_auditor">
            <User size={14} className="field-icon" />
            <span>Auditor/a <span className="req-star">*</span></span>
          </label>
          <input
            id="f_auditor"
            type="text"
            autoComplete="name"
            value={fields.f_auditor}
            onChange={e => onFieldChange('f_auditor', e.target.value)}
            placeholder="Nombre"
          />
        </div>

        {/* 3. Fecha con Custom DatePicker */}
        <div className="field-item">
          <label>
            <span>Fecha</span>
          </label>
          <CustomDatePicker
            value={fields.f_fecha}
            onChange={val => onFieldChange('f_fecha', val)}
          />
        </div>

        {/* 4. Personal a cargo */}
        <div className="field-item">
          <label htmlFor="f_cargo">
            <Briefcase size={14} className="field-icon" />
            <span>A cargo</span>
          </label>
          <input
            id="f_cargo"
            type="text"
            autoComplete="off"
            value={fields.f_cargo}
            onChange={e => onFieldChange('f_cargo', e.target.value)}
            placeholder="Encargado/a"
          />
        </div>

        {/* 5. Colaboradores */}
        <div className="field-item">
          <label htmlFor="f_colab">
            <Users size={14} className="field-icon" />
            <span>Colaboradores</span>
          </label>
          <input
            id="f_colab"
            type="number"
            inputMode="numeric"
            min="0"
            value={fields.f_colab}
            onChange={e => onFieldChange('f_colab', e.target.value)}
            placeholder="Cant."
            className="no-spinners"
          />
        </div>

        {/* 6. Unidades vendidas */}
        <div className="field-item">
          <label htmlFor="f_unid">
            <ShoppingBag size={14} className="field-icon" />
            <span>Unidades</span>
          </label>
          <input
            id="f_unid"
            type="number"
            inputMode="numeric"
            min="0"
            value={fields.f_unid}
            onChange={e => onFieldChange('f_unid', e.target.value)}
            placeholder="Unid."
            className="no-spinners"
          />
        </div>
      </div>
    </section>
  );
};
