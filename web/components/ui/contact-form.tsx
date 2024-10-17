import React, { useState } from 'react';
import { submitContactForm } from '../../lib/mailchimp';
import { Button } from './button';
import { Input } from './input';
import { TextArea } from './textarea';

const ContactForm: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

    const validateEmail = (email: string) => {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name || !email || !message) {
            alert('Please fill in all fields');
            return;
        }

        if (!validateEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const success = await submitContactForm({ name, email, message, subscribeNewsletter });
            if (success) {
                setSubmitStatus('success');
                // Reset the form fields after successful submission
                setName('');
                setEmail('');
                setMessage('');
                setSubscribeNewsletter(false);
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-black mb-1">Name</label>
                <Input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border bg-white border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-black mb-1">Email</label>
                <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border bg-white border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div>
                <label htmlFor="message" className="block text-sm font-medium text-black mb-1">Message</label>
                <TextArea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 border bg-white border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div className="flex items-center">
                <Input
                    type="checkbox"
                    id="subscribe"
                    checked={subscribeNewsletter}
                    onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                    className="h-4 w-4 text-white bg-white focus:ring-black border-gray-300 rounded"
                />
                <label htmlFor="subscribe" className="ml-2 block text-sm text-black">
                    Subscribe to newsletter
                </label>
            </div>
            <div>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-black swap-button-style focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    <span className="text-black text-primary-content text-sm">
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                    </span>
                </Button>
            </div>
            
            {submitStatus === 'success' && (
                <p className="text-green-600">Message sent successfully!</p>
            )}
            {submitStatus === 'error' && (
                <p className="text-red-600">Error sending message. Please try again.</p>
            )}
        </form>
    );
};

export default ContactForm;
