import React, { useEffect } from 'react';
import { FiX as CloseIcon } from 'react-icons/fi';

export default function Modal({ isOpen, onClose, title, size = '3xl', children }) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Dynamic Tailwind sizing map
  const sizes = {
    sm: 'max-w-sm',     // 384px
    md: 'max-w-md',     // 448px (Original size)
    lg: 'max-w-lg',     // 512px
    xl: 'max-w-xl',     // 576px (Great for basic grids)
    '2xl': 'max-w-2xl', // 672px (Perfect for wide tables or dual columns)
    '3xl': 'max-w-3xl', // 768px
  };

  const modalSizeClass = sizes[size] || 'max-w-3xl';

  return (
    <>
      {/* 1. Backdrop Blur Overlay (Slightly darker in Dark Mode for better contrast) */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 bg-zinc-950/20 dark:bg-zinc-950/40 backdrop-blur-sm transition-opacity"
      />
      
      {/* 2. Modal Center Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 🛑 Modal Card Panel: Upgraded with dark:bg-zinc-950 and dark:border-zinc-800 */}
        <div className={`w-full ${modalSizeClass} transform overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xl transition-all animate-in fade-in zoom-in-95 duration-150`}>
          
          {/* Header Block: Upgraded with dark:border-zinc-800 */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 transition-colors">
            {/* 🛑 Title Text: Upgraded with dark:text-zinc-50 */}
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {title}
            </h3>
            {/* 🛑 Close Button: Upgraded with dark:text-zinc-400 and dark:hover:bg-zinc-900 */}
            <button 
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
          
          {/* Content Body (Automatically inherits dark-text colors from parent containers) */}
          <div className="mt-4 max-h-[75vh] overflow-y-auto pr-1 text-zinc-700 dark:text-zinc-300">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}