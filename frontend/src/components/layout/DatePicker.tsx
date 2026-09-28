import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  onClose: () => void;
  maxDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onChange, onClose, maxDate }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      if (rect.bottom > viewportHeight) {
        popupRef.current.style.top = 'auto';
        popupRef.current.style.bottom = 'calc(100% + 8px)';
      }
    }
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (maxDate && date > maxDate) return;
    onChange(date);
    onClose();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();
  };

  const isFuture = (day: number) => {
    if (!maxDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    date.setHours(0,0,0,0);
    const max = new Date(maxDate);
    max.setHours(0,0,0,0);
    return date > max;
  };

  return (
    <div ref={popupRef} style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: 0,
      width: '280px',
      backgroundColor: '#FEFCF8',
      border: '1px solid rgba(139, 90, 43, 0.15)',
      borderRadius: '12px',
      padding: '1rem',
      zIndex: 50,
      boxShadow: '0 10px 25px rgba(124, 77, 46, 0.12)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}><ChevronLeft size={16} /></button>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2C1810' }}>
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}><ChevronRight size={16} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.2rem', marginBottom: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#A89080', fontWeight: 600 }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.2rem' }}>
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const disabled = isFuture(day);
          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => handleDateClick(day)}
              style={{
                background: isSelected(day) ? '#7C4D2E' : isToday(day) ? 'rgba(124, 77, 46, 0.1)' : 'transparent',
                color: isSelected(day) ? 'white' : disabled ? '#A89080' : '#4A2E1A',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                margin: '0 auto',
                fontWeight: isSelected(day) || isToday(day) ? 'bold' : 'normal',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', borderTop: '1px solid rgba(139, 90, 43, 0.1)', paddingTop: '0.5rem' }}>
        <button onClick={() => { onChange(new Date()); onClose(); }} style={{ background: 'none', border: 'none', color: '#7C4D2E', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>Today</button>
        <button onClick={() => { onChange(null); onClose(); }} style={{ background: 'none', border: 'none', color: '#A89080', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><X size={14} /> Clear</button>
      </div>
    </div>
  );
};
