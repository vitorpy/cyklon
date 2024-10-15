'use client';

import { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '../ui/header';
import { SolanaSwapComponent } from '@/components/solana-swapper/solana-swap';
import Image from "next/image";
import NewsletterInput from '@/components/ui/newsletter-input';
import ContactForm from '@/components/ui/contact-form';

export default function LandingPage() {
  const [showBanner, setShowBanner] = useState(true);
  const [currentImage, setCurrentImage] = useState(1);
  const totalImages = 6;
  const wallet = useWallet();

  useEffect(() => {
    const walletAddress = wallet.connected ? wallet.publicKey?.toString() : null;

    // Identify user if wallet is connected
    if (walletAddress) {
      posthog.identify(walletAddress);
    }

    // Capture page load event
    posthog.capture('Landing Page Loaded', {
      walletConnected: wallet.connected,
      walletAddress: walletAddress,
    });
  }, [wallet.connected, wallet.publicKey]);

  const nextImage = () => {
    setCurrentImage((prev) => (prev % totalImages) + 1);
    posthog.capture('Next Image Clicked', { currentImage: currentImage });
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev === 1 ? totalImages : prev - 1));
    posthog.capture('Previous Image Clicked', { currentImage: currentImage });
  };

  const scrollToNewsletter = () => {
    const newsletterSection = document.getElementById('newsletter-section');
    if (newsletterSection) {
      newsletterSection.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        const emailInput = document.getElementById('newsletter-email');
        if (emailInput) {
          (emailInput as HTMLInputElement).focus();
        }
      }, 1000); // Delay to ensure smooth scroll completes
    }
  };

  return (
    <div className="w-full">
      {showBanner && (
        <div className="bg-black text-white p-3 flex justify-between items-center">
          <p className="text-center w-full">Blackpool is now Darklake.</p>
          <button 
            onClick={() => setShowBanner(false)}
            className="text-white hover:text-gray-300"
            aria-label="Dismiss banner"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {/* Panel 1 */}
      <div className="hero relative w-full flex flex-col items-center justify-center" style={{ minHeight: '90vh' }}>
        <div className="hero-content w-full flex flex-col items-center justify-center">
          <div className="z-10 text-center px-4 bg-transparent mb-8">
            <Header title="Secure. Private. Efficient." subtitle="Solana's first DEX delivering real-time, MEV-resistant order execution." />
          </div>
          
          <div className="flex flex-col md:flex-row justify-center items-start gap-8 w-full max-w-6xl px-4">
            <div className="w-full md:w-1/2">
              <SolanaSwapComponent />
            </div>
            
            <div className="w-full md:w-1/2 text-black p-6">
              <h2 className="text-2xl font-bold mb-4">Welcome to Darklake</h2>
              <p className="mb-4">Explore the future of decentralized trading &ndash; now on Solana&apos;s devnet.</p>
              
              <h3 className="text-xl font-semibold mb-2">What This Means for You:</h3>
              <ul className="list-disc list-inside mb-4">
                <li>Risk-free testing environment</li>
                <li>Your feedback shapes our platform</li>
              </ul>
              
              <h3 className="text-xl font-semibold mb-2">Get Started:</h3>
              <ul className="list-disc list-inside mb-4">
                <li><a href="https://faucet.paxos.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Get PYUSD test tokens</a></li>
                <li><a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Get SOL test tokens</a></li>
                <li>Start exploring Darklake</li>
              </ul>
              
              <p className="mb-2">Stay updated on our mainnet launch:</p>
              <a 
                onClick={scrollToNewsletter}
                className="text-blue-400 hover:underline cursor-pointer"
              >
                Subscribe to Our Newsletter
              </a>
            </div>
          </div>
        </div>

        {/* Scroll to learn more */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-black">
          <p className="mb-2">Scroll to learn more</p>
          <i className="fas fa-chevron-down text-2xl animate-bounce"></i>
        </div>
      </div>

      {/* Panel 2 */}
      <div className="flex w-full second-panel-style items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="relative w-full">
          <Image
            src={`/images/explainer/${currentImage}.svg`}
            alt={`Explainer ${currentImage}`}
            width={1920}
            height={1080}
            style={{
              objectFit: "cover"
            }}
            className="mx-auto"
          />
          <button
            onClick={prevImage}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-r"
            aria-label="Previous image"
          >
            <i className="fas fa-chevron-left text-2xl"></i>
          </button>
          <button
            onClick={nextImage}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-l"
            aria-label="Next image"
          >
            <i className="fas fa-chevron-right text-2xl"></i>
          </button>
        </div>
      </div>

      {/* Panel 3 */}
      <div className="w-full third-panel-style flex flex-col sm:flex-row text-black" style={{ minHeight: '75vh' }}>
        <div className='w-full sm:w-1/2 relative p-4 flex flex-col items-center justify-center'>
          <Header title="Contact Us" subtitle="Have questions or feedback? Contact us below" />
          <ContactForm />
        </div>
        <div id="newsletter-section" className='w-full sm:w-1/2 relative p-4 flex flex-col items-center justify-center'>
          <Header title="Newsletter" subtitle="Sign up with your email address to receive news and updates" />
          <NewsletterInput />
        </div>
      </div>

      {/* Panel 4 */}
      <div className="w-full bg-black flex flex-col-reverse sm:flex-row text-white">
        <div className='w-full relative p-4 flex flex-col items-center justify-center'>
          <div className='flex flex-col items-center justify-center w-full'>
            <div className="flex space-x-6">
              <a href="https://twitter.com/darklakefi" target="_blank" rel="noopener noreferrer" className="text-3xl text-white hover:text-blue-600">
                <i className="fab fa-x-twitter"></i>
              </a>
              <a href="https://github.com/darklakefi" target="_blank" rel="noopener noreferrer" className="text-3xl text-white hover:text-gray-600">
                <i className="fab fa-github"></i>
              </a>
              <a href="https://t.me/darklakefi" target="_blank" rel="noopener noreferrer" className="text-3xl text-white hover:text-blue-400">
                <i className="fab fa-telegram"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
