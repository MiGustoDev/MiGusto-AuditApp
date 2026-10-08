import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse current selected date
  const parseDate = (dStr: string) => {
    if (!dStr) return new Date();
    const [y, m, d] = dStr.split('-').map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  };

  const selectedDate = parseDate(value);
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  // Sync view when value changes
  useEffect(() => {
    const d = parseDate(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  // Animate popover with GSAP
  useEffect(() => {
    if (isOpen && popoverRef.current) {
      gsap.fromTo(
        popoverRef.current,
        { opacity: 0, y: -8, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const yStr = viewYear.toString();
    const mStr = (viewMonth + 1).toString().padStart(2, '0');
    const dStr = day.toString().padStart(2, '0');
    onChange(`${yStr}-${mStr}-${dStr}`);
    setIsOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const yStr = today.getFullYear().toString();
    const mStr = (today.getMonth() + 1).toString().padStart(2, '0');
    const dStr = today.getDate().toString().padStart(2, '0');
    onChange(`${yStr}-${mStr}-${dStr}`);
    setIsOpen(false);
  };

  // Build calendar matrix
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  // Adjust so Monday = 0, Sunday = 6
  const startDayOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const formattedDisplay = value
    ? `${value.split('-')[2]}/${value.split('-')[1]}/${value.split('-')[0]}`
    : 'Seleccionar fecha';

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const [y, m, d] = value.split('-').map(Number);
    return y === viewYear && m - 1 === viewMonth && d === day;
  };

  return (
    <div className="custom-datepicker-container" ref={containerRef}>
      <button
        type="button"
        className="datepicker-trigger-btn"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Seleccionar fecha"
      >
        <span className="date-display-text num">{formattedDisplay}</span>
        <CalendarIcon size={14} className="datepicker-icon" />
      </button>

      {isOpen && (
        <div ref={popoverRef} className="datepicker-popover">
          {/* Header */}
          <div className="datepicker-header">
            <button
              type="button"
              className="datepicker-nav-btn"
              onClick={handlePrevMonth}
              aria-label="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="datepicker-title">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              className="datepicker-nav-btn"
              onClick={handleNextMonth}
              aria-label="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="datepicker-weekdays">
            {DAY_NAMES.map(name => (
              <span key={name} className="weekday-col">{name}</span>
            ))}
          </div>

          {/* Days grid */}
          <div className="datepicker-days-grid">
            {/* Prev month fill */}
            {Array.from({ length: startDayOffset }).map((_, i) => {
              const prevDay = daysInPrevMonth - startDayOffset + i + 1;
              return (
                <span key={`prev-${i}`} className="day-cell muted">
                  {prevDay}
                </span>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  className={`day-cell active-month ${selected ? 'selected' : ''} ${today ? 'is-today' : ''}`}
                  onClick={() => handleSelectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer action */}
          <div className="datepicker-footer">
            <button
              type="button"
              className="btn-today-shortcut"
              onClick={handleSetToday}
            >
              Hoy
            </button>
            <button
              type="button"
              className="btn-today-shortcut"
              onClick={() => setIsOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
