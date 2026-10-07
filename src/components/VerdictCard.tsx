import React from 'react';
import { AuditSummary } from '../types/audit';

interface VerdictCardProps {
  summary: AuditSummary;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ summary }) => {
  return (
    <div className={`verdict ${summary.statusClass}`} id="verdict">
      <strong id="verdictTitle">{summary.verdictTitle}</strong>
      <span id="verdictTxt">{summary.verdictText}</span>
    </div>
  );
};
