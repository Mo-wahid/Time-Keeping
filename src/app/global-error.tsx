'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 flex min-h-screen items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-950 text-red-400">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Critical Application Error</h2>
          <p className="text-sm text-zinc-400 mb-6">
            The application encountered an unexpected error. Please try again.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => retry()}
              className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 font-medium text-sm hover:bg-white transition cursor-pointer"
            >
              Try again
            </button>
            <a
              href="/today"
              className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 font-medium text-sm hover:bg-zinc-700 transition cursor-pointer"
            >
              Reload Sproj
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
