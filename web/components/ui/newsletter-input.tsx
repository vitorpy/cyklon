import React, { useState, KeyboardEvent } from 'react';
import { subscribeToNewsletter } from '@/lib/mailchimp';
import posthog from 'posthog-js';
import { Button } from './button';
import { Input } from './input';

const NewsletterInput: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address.');
      return;
    }

    // Call the subscribeToNewsletter function
    const success = await subscribeToNewsletter({ email });

    if (success) {
      setMessage('Thank you for subscribing!');
      setEmail('');
    } else {
      setMessage('An error occurred. Please try again later.');
    }

    posthog.capture('Newsletter Subscription', { email });
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleSubmit(e as any);
    }
  };

  return (
    <div id="newsletter-section" className="w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row sm:space-x-2"
      >
        <Input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your email"
          className="mt-1 block w-full px-3 py-2 border bg-white border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <Button
          type="submit"
          className="mt-2 sm:mt-1 flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-black swap-button-style focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <span className="text-black text-primary-content text-sm">
            Subscribe
          </span>
        </Button>
      </form>
      <p id="newsletter-message" className="text-black mt-2">
        {message}
      </p>
    </div>
  );
};

export default NewsletterInput;
