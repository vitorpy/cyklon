import React, { useState } from 'react';
import { subscribeToNewsletter } from '@/lib/mailchimp';

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
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="px-4 py-2 border bg-white border-gray-300 text-black rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                    type="submit"
                    className="px-4 py-2 text-white rounded-md swap-button-style focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <span className="text-black">Subscribe</span>
                </button>
            </form>
            {message && <p className="mt-2 text-sm">{message}</p>}
        </div>
    );
};

export default NewsletterInput;
