import { useState, useRef, useEffect } from 'react';

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function CustomSelect({ value, onChange, options, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder || 'Select an option';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <style>{`
        .custom-select-button {
          width: 100%;
          padding: 6px 8px;
          background-color: #ffffff;
          color: #000000;
          border: 1px solid #999999;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 36px;
          text-align: left;
        }

        .custom-select-button:hover {
          background-color: #f5f5f5;
        }

        .custom-select-button:focus {
          outline: 2px solid #333333;
          outline-offset: 0;
        }

        .custom-select-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background-color: #ffffff;
          border: 1px solid #999999;
          border-top: none;
          border-radius: 0 0 4px 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 10;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .custom-select-option {
          padding: 8px;
          color: #000000;
          cursor: pointer;
          background-color: #ffffff;
          border: none;
          width: 100%;
          text-align: left;
          font-size: 14px;
        }

        .custom-select-option:hover {
          background-color: #e8e8e8;
        }

        .custom-select-option.selected {
          background-color: #d9d9d9;
          font-weight: bold;
        }

        .custom-select-arrow {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }

        .custom-select-arrow.open {
          transform: rotate(180deg);
        }
      `}</style>

      <button
        className="custom-select-button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{selectedLabel}</span>
        <span className={`custom-select-arrow ${isOpen ? 'open' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="custom-select-dropdown">
          {options.map((option) => (
            <button
              key={option.value}
              className={`custom-select-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
