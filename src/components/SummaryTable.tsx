import React from 'react';
import { AuditSummary } from '../types/audit';
import { f2 } from '../utils/formatters';

interface SummaryTableProps {
  summary: AuditSummary;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ summary }) => {
  return (
    <>
      <h2 id="resumen">Resumen por segmento</h2>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Segmento</th>
              <th>Ideal</th>
              <th>Real</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map(r => (
              <tr key={r.si}>
                <td>
                  {r.si + 1}. {r.seg.name}
                </td>
                <td>{f2(r.ideal)}</td>
                <td>{f2(r.real)}</td>
                <td>{((r.real / r.ideal) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td>100.00</td>
              <td>{f2(summary.total)}</td>
              <td>{summary.total.toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
};
