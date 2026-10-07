import React from 'react';
import { Deviation } from '../types/audit';
import { f2 } from '../utils/formatters';

interface DeviationsListProps {
  deviations: Deviation[];
}

export const DeviationsList: React.FC<DeviationsListProps> = ({ deviations }) => {
  return (
    <>
      <h2>Desvíos</h2>
      <ol className="devs" id="devs">
        {deviations.length === 0 ? (
          <li className="sm">Todavía no hay ítems marcados como Parcial o No.</li>
        ) : (
          deviations.map(d => (
            <li key={d.k}>
              <b>{d.n}</b> ({f2(d.got)} de {f2(d.ideal)}) <span>{d.t}</span>
              {d.a.o && <div className="sm">Obs.: {d.a.o}</div>}
            </li>
          ))
        )}
      </ol>
    </>
  );
};
