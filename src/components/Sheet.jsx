import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Bottom sheet modal yang nyaman dipakai di HP.
 * `printable` = isi sheet ikut tercetak saat window.print().
 */
export function Sheet({ open, onClose, title, icon: Icon, children, footer, printable = false, z = 'z-40' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${z} flex animate-fade-in items-end justify-center bg-slate-900/60 ${
        printable ? 'print:static print:bg-white' : 'print:hidden'
      }`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90dvh] w-full max-w-md animate-slide-up flex-col rounded-t-2xl bg-white shadow-2xl print:max-h-none print:animate-none print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4 print:hidden">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            {Icon && <Icon className="size-5 text-blue-600" />} {title}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Tutup">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 print:overflow-visible print:bg-white">{children}</div>
        {footer && <div className="border-t border-slate-100 bg-white p-4 print:hidden">{footer}</div>}
      </div>
    </div>
  );
}
