import React from 'react';
import { Header } from '@/components/ui/header';

export default function NewsletterPage() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-screen">
      <Header title="Thank you." subtitle="Thank you for signing up for our newsletter." />
      <p className="text-center text-black text-light">Click <a href="/" className="underline">here</a> to go back to the main page.</p>
    </div>
  );
}