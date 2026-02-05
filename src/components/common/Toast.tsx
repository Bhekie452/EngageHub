import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';
type ToastItem = { id: string; type: ToastType; message: string };

type ToastContextType = {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const add = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    setToasts((t) => [...t, { id, type, message }]);
    return id;
  }, []);

  const remove = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((t) => {
      const timer = setTimeout(() => remove(t.id), 4500);
      return () => clearTimeout(timer);
    });
    return () => timers.forEach((c) => c());
  }, [toasts, remove]);

  const ctx: ToastContextType = {
    success: (m: string) => add('success', m),
    error: (m: string) => add('error', m),
    info: (m: string) => add('info', m),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div aria-live="polite" className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`max-w-sm w-full px-4 py-3 rounded-lg shadow-lg border flex items-start gap-3 ${
              t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex-1 text-sm font-medium">{t.message}</div>
            <button onClick={() => remove(t.id)} className="text-xs text-slate-500 ml-2">Dismiss</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export default ToastProvider;
