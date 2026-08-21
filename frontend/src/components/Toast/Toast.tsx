import { useState, useCallback } from 'react';
import { CheckCircle, Info } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'info';
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'info' = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, showToast };
}

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed bottom-7 right-7 z-[2000] flex flex-col gap-2.5">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`bg-slate-800 text-slate-50 px-6 py-3 rounded-full text-sm flex items-center gap-2.5 animate-[slideUp_0.4s_ease] border-l-4 ${
            toast.type === 'success' ? 'border-l-green-500' : 'border-l-blue-500'
          }`}
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
        >
          {toast.type === 'success' ? <CheckCircle size={16} /> : <Info size={16} />}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
