import React from 'react';
import { AuditFields } from '../types/audit';

interface GeneralFieldsProps {
  fields: AuditFields;
  onFieldChange: (field: keyof AuditFields, value: string) => void;
}

export const GeneralFields: React.FC<GeneralFieldsProps> = ({ fields, onFieldChange }) => {
  return (
    <section className="card" aria-label="Datos generales">
      <div className="fields">
        <label htmlFor="f_tienda">
          Tienda
          <input
            id="f_tienda"
            type="text"
            autoComplete="off"
            value={fields.f_tienda}
            onChange={e => onFieldChange('f_tienda', e.target.value)}
            placeholder="Ej. Sucursal Palermo"
          />
        </label>

        <label htmlFor="f_auditor">
          Auditor/a
          <input
            id="f_auditor"
            type="text"
            autoComplete="name"
            value={fields.f_auditor}
            onChange={e => onFieldChange('f_auditor', e.target.value)}
            placeholder="Nombre y apellido"
          />
        </label>

        <label htmlFor="f_fecha">
          Fecha
          <input
            id="f_fecha"
            type="date"
            value={fields.f_fecha}
            onChange={e => onFieldChange('f_fecha', e.target.value)}
          />
        </label>

        <label htmlFor="f_colab">
          Colaboradores
          <input
            id="f_colab"
            type="number"
            inputMode="numeric"
            min="0"
            value={fields.f_colab}
            onChange={e => onFieldChange('f_colab', e.target.value)}
            placeholder="Cantidad"
          />
        </label>

        <label htmlFor="f_cargo">
          Personal a cargo
          <input
            id="f_cargo"
            type="text"
            autoComplete="off"
            value={fields.f_cargo}
            onChange={e => onFieldChange('f_cargo', e.target.value)}
            placeholder="Encargado/a de turno"
          />
        </label>

        <label htmlFor="f_unid">
          Unidades vendidas
          <input
            id="f_unid"
            type="number"
            inputMode="numeric"
            min="0"
            value={fields.f_unid}
            onChange={e => onFieldChange('f_unid', e.target.value)}
            placeholder="Unidades"
          />
        </label>
      </div>
    </section>
  );
};
