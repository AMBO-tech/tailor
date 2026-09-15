import React from 'react';
import { Lock } from 'lucide-react';

interface PinInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  placeholder?: string;
  disabled?: boolean;
}

export const PinInput: React.FC<PinInputProps> = ({
  value,
  onChange,
  length = 4,
  placeholder = '••••',
  disabled = false,
}) => {
  return (
    <div className="relative">
      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
      <input
        type="password"
        inputMode="numeric"
        required
        disabled={disabled}
        maxLength={length}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm tracking-widest text-center font-mono focus:outline-none focus:border-emerald-500 text-slate-100 placeholder-slate-600 disabled:opacity-50"
      />
    </div>
  );
};
