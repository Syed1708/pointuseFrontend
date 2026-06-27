import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiAlertTriangle } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4 transition-colors">
      {/* Background Dots */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      <div className="w-full max-w-md text-center space-y-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 shadow-sm transition-colors">
        
        {/* Warning Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
          <FiAlertTriangle className="h-6 w-6" />
        </div>

        {/* Error Headers */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            404 - Page Not Found
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            The page you are looking for does not exist, has been moved, or you do not have permission to view it.
          </p>
        </div>

        {/* Action Button */}
        <div>
          <Link
            to="/dashboard"
            className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-50 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition shadow-sm"
          >
            <FiHome className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}