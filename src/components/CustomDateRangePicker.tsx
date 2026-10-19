import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { fmtDate, getTodayDate } from '../utils/formatters';

interface CustomDateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onSelectRange: (from: string, to: string) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  dateFrom,
  dateTo,
  onSelectRange,
  onClose
}) => {
  const todayStr = useMemo(() => getTodayDate(), []);

  // Determine initial month/year to display
  const initialDate = dateFrom || dateTo || todayStr;
  const initialYear = parseInt(initialDate.slice(0, 4), 10) || new Date().getFullYear();
  const initialMonth = (parseInt(initialDate.slice(5, 7), 10) || new Date().getMonth() + 1) - 1;

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);
  const [activeInput, setActiveInput] = useState<'from' | 'to'>('from');
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Manual typing text states
  const [textFrom, setTextFrom] = useState<string>(dateFrom ? fmtDate(dateFrom) : '');
  const [textTo, setTextTo] = useState<string>(dateTo ? fmtDate(dateTo) : '');

  useEffect(() => {
    setTextFrom(dateFrom ? fmtDate(dateFrom) : '');
  }, [dateFrom]);

  useEffect(() => {
    setTextTo(dateTo ? fmtDate(dateTo) : '');
  }, [dateTo]);

  // Navigate month
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Convert day click to date string YYYY-MM-DD
  const formatYMD = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Click on a calendar day
  const handleDayClick = (dStr: string) => {
    if (activeInput === 'from') {
      if (dateTo && dStr > dateTo) {
        // If from is after to, reset to and set from
        onSelectRange(dStr, '');
      } else {
        onSelectRange(dStr, dateTo);
      }
      setActiveInput('to');
    } else {
      // activeInput === 'to'
      if (!dateFrom) {
        onSelectRange(dStr, '');
        setActiveInput('to');
      } else if (dStr < dateFrom) {
        // If clicked day is before dateFrom, make it dateFrom
        onSelectRange(dStr, dateTo);
      } else {
        onSelectRange(dateFrom, dStr);
      }
    }
  };

  // Presets
  const applyPreset = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'prevMonth') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      const t = toYMD(now);
      onSelectRange(t, t);
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(now.getDate() - 1);
      const yStr = toYMD(y);
      onSelectRange(yStr, yStr);
      setViewYear(y.getFullYear());
      setViewMonth(y.getMonth());
    } else if (preset === 'week') {
      const start = new Date();
      start.setDate(now.getDate() - 6);
      onSelectRange(toYMD(start), toYMD(now));
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      onSelectRange(toYMD(firstDay), toYMD(now));
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    } else if (preset === 'prevMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      onSelectRange(toYMD(firstDay), toYMD(lastDay));
      setViewYear(firstDay.getFullYear());
      setViewMonth(firstDay.getMonth());
    }
  };

  const handleClear = () => {
    onSelectRange('', '');
    setActiveInput('from');
  };

  // Parse manual DD/MM/YYYY text typing
  const parseDDMMYYYY = (val: string): string | null => {
    const clean = val.trim();
    const parts = clean.split(/[/-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    return null;
  };

  const handleTextFromChange = (val: string) => {
    setTextFrom(val);
    const parsed = parseDDMMYYYY(val);
    if (parsed) {
      onSelectRange(parsed, dateTo);
      setViewYear(parseInt(parsed.slice(0, 4), 10));
      setViewMonth(parseInt(parsed.slice(5, 7), 10) - 1);
    }
  };

  const handleTextToChange = (val: string) => {
    setTextTo(val);
    const parsed = parseDDMMYYYY(val);
    if (parsed) {
      onSelectRange(dateFrom, parsed);
      setViewYear(parseInt(parsed.slice(0, 4), 10));
      setViewMonth(parseInt(parsed.slice(5, 7), 10) - 1);
    }
  };

  // Generate calendar grid
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dStr = formatYMD(prevYear, prevMonth, d);
    calendarDays.push({ day: d, isCurrentMonth: false, dStr });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dStr = formatYMD(viewYear, viewMonth, d);
    calendarDays.push({ day: d, isCurrentMonth: true, dStr });
  }

  // Next month leading days to complete full rows (multiple of 7)
  const remaining = 7 - (calendarDays.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dStr = formatYMD(nextYear, nextMonth, d);
      calendarDays.push({ day: d, isCurrentMonth: false, dStr });
    }
  }

  const hasFilter = Boolean(dateFrom || dateTo);

  return (
    <div className="custom-calendar-popup" role="dialog" aria-label="Selector de rango de fechas">
      {/* Header */}
      <div className="custom-cal-header">
        <div className="custom-cal-title">
          <Calendar size={15} className="custom-cal-icon-accent" />
          <span>Filtro por Fecha</span>
        </div>
        {hasFilter && (
          <button
            type="button"
            className="btn-cal-clear-text"
            onClick={handleClear}
            title="Borrar fechas seleccionadas"
          >
            Borrar
          </button>
        )}
      </div>

      {/* Inputs Bar */}
      <div className="custom-cal-inputs-row">
        <div
          className={`custom-cal-input-box ${activeInput === 'from' ? 'is-focused' : ''}`}
          onClick={() => setActiveInput('from')}
        >
          <span className="cal-input-label">Desde</span>
          <div className="cal-input-field-wrap">
            <input
              type="text"
              placeholder="dd/mm/aaaa"
              value={textFrom}
              onChange={e => handleTextFromChange(e.target.value)}
              onFocus={() => setActiveInput('from')}
              className="cal-text-input"
            />
            {dateFrom ? (
              <button
                type="button"
                className="cal-btn-icon-clear"
                onClick={e => {
                  e.stopPropagation();
                  onSelectRange('', dateTo);
                  setTextFrom('');
                }}
                title="Quitar fecha desde"
              >
                <X size={12} />
              </button>
            ) : (
              <Calendar size={13} className="cal-input-icon" />
            )}
          </div>
        </div>

        <div className="cal-inputs-separator">→</div>

        <div
          className={`custom-cal-input-box ${activeInput === 'to' ? 'is-focused' : ''}`}
          onClick={() => setActiveInput('to')}
        >
          <span className="cal-input-label">Hasta</span>
          <div className="cal-input-field-wrap">
            <input
              type="text"
              placeholder="dd/mm/aaaa"
              value={textTo}
              onChange={e => handleTextToChange(e.target.value)}
              onFocus={() => setActiveInput('to')}
              className="cal-text-input"
            />
            {dateTo ? (
              <button
                type="button"
                className="cal-btn-icon-clear"
                onClick={e => {
                  e.stopPropagation();
                  onSelectRange(dateFrom, '');
                  setTextTo('');
                }}
                title="Quitar fecha hasta"
              >
                <X size={12} />
              </button>
            ) : (
              <Calendar size={13} className="cal-input-icon" />
            )}
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="custom-cal-nav">
        <button
          type="button"
          className="btn-cal-nav-arrow"
          onClick={handlePrevMonth}
          title="Mes anterior"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="custom-cal-current-month">
          <span className="cal-month-text">{MONTH_NAMES[viewMonth]}</span>
          <span className="cal-year-text">{viewYear}</span>
        </div>

        <button
          type="button"
          className="btn-cal-nav-arrow"
          onClick={handleNextMonth}
          title="Mes siguiente"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekdays */}
      <div className="custom-cal-weekdays">
        {WEEKDAYS.map(w => (
          <span key={w} className="cal-weekday">
            {w}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="custom-cal-days-grid" onMouseLeave={() => setHoverDate(null)}>
        {calendarDays.map(({ day, isCurrentMonth, dStr }) => {
          const isToday = dStr === todayStr;
          const isStart = dStr === dateFrom;
          const isEnd = dStr === dateTo;
          const isInRange = Boolean(
            dateFrom && dateTo && dStr > dateFrom && dStr < dateTo
          );

          // Preview range on hover
          const isHoverRange = Boolean(
            activeInput === 'to' &&
              dateFrom &&
              !dateTo &&
              hoverDate &&
              dStr > dateFrom &&
              dStr <= hoverDate
          );

          let dayClasses = 'custom-cal-day';
          if (!isCurrentMonth) dayClasses += ' is-other-month';
          if (isToday) dayClasses += ' is-today';
          if (isStart) dayClasses += ' is-start-date';
          if (isEnd) dayClasses += ' is-end-date';
          if (isInRange) dayClasses += ' is-in-range';
          if (isHoverRange) dayClasses += ' is-hover-range';

          return (
            <button
              key={dStr}
              type="button"
              className={dayClasses}
              onClick={() => handleDayClick(dStr)}
              onMouseEnter={() => setHoverDate(dStr)}
              title={`${day} de ${MONTH_NAMES[parseInt(dStr.slice(5, 7), 10) - 1]} de ${dStr.slice(0, 4)}`}
            >
              <span className="day-number">{day}</span>
              {isToday && <span className="today-dot" />}
            </button>
          );
        })}
      </div>

      {/* Quick Presets */}
      <div className="custom-cal-presets">
        <button
          type="button"
          className="btn-cal-preset"
          onClick={() => applyPreset('today')}
        >
          Hoy
        </button>
        <button
          type="button"
          className="btn-cal-preset"
          onClick={() => applyPreset('week')}
        >
          7 días
        </button>
        <button
          type="button"
          className="btn-cal-preset"
          onClick={() => applyPreset('month')}
        >
          Este mes
        </button>
        <button
          type="button"
          className="btn-cal-preset"
          onClick={() => applyPreset('prevMonth')}
        >
          Mes ant.
        </button>
      </div>

      {/* Footer */}
      <div className="custom-cal-footer">
        <div className="cal-selected-summary">
          {hasFilter ? (
            <span>
              {dateFrom ? fmtDate(dateFrom) : '...'} → {dateTo ? fmtDate(dateTo) : '...'}
            </span>
          ) : (
            <span className="cal-hint-text">Seleccioná un rango de fechas</span>
          )}
        </div>

        <button
          type="button"
          className="btn-cal-apply"
          onClick={onClose}
        >
          Listo
        </button>
      </div>
    </div>
  );
};
