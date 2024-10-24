import React from 'react';
import { Header } from '@/components/ui/header';

export default function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-screen">
      <Header title="404" subtitle="Page not found." />
      <p className="text-center text-black text-light">
        Click{' '}
        <a href="/" className="underline">
          here
        </a>{' '}
        to go back to the main page.
      </p>
    </div>
  );
}
