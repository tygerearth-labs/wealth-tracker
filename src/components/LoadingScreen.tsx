'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Memuat...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="mx-auto h-16 w-16 animate-spin text-navy-900" />
        <p className="mt-4 text-lg font-semibold text-gray-900">{message}</p>
      </div>
    </div>
  );
}
