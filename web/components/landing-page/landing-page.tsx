'use client';

import { useState } from 'react';
import { Header } from '../ui/header';
import { SolanaSwapComponent } from '../solana-swapper/solana-swap';
import Image from "next/image";
import NewsletterInput from '../ui/newsletter-input';
import ContactForm from '../ui/contact-form';

export default function LandingPage() {
  const [showBanner, setShowBanner] = useState(true);

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
      <div className="flex w-full relative" style={{ minHeight: '90vh' }}>
        <div className="w-full sm:w-1/3 overflow-y-auto px-4">
          <Header title="Secure. Private. Efficient." subtitle="Darklake: Advanced privacy-preserving trading platform powered by Solana technology." />
          <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-9 mt-[50px]">
            <SolanaSwapComponent />
          </div>
          <div className="flex justify-center items-center text-white cursor-default">
            <div className="w-96 bg-black text-white p-4 mt-4 rounded-lg shadow-xl">
              <p className="mb-2">For testing, get tokens from these faucets:</p>
              <ul className="list-disc list-inside">
                <li><a href="https://faucet.paxos.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">PYUSD Devnet Faucet</a></li>
                <li><a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Solana Devnet Faucet</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="hidden sm:block sm:w-2/3 relative">
          <Image
            src="/images/background.jpg"
            alt="Background"
            fill
            sizes="100vw"
            style={{
              objectFit: "cover"
            }} />
        </div>
        
        {/* Scroll to learn more */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-black">
          <p className="mb-2">Scroll to learn more</p>
          <i className="fas fa-chevron-down text-2xl animate-bounce"></i>
        </div>
      </div>

      {/* Panel 2 */}
      <div className="flex w-full second-panel-style" style={{ minHeight: '90vh' }}>
        <div className='hidden sm:block sm:w-1/2 overflow-y-auto px-4 relative'>
          <Image
            src="/images/newsletter.jpg"
            alt="Newsletter Background"
            fill
            sizes="100vw"
            style={{
              objectFit: "contain"
            }} />
        </div>
        <div className='w-full sm:w-1/2 relative p-4 flex flex-col items-center justify-center text-black'>
          <Header title="Newsletter" subtitle="Sign up with your email address to receive news and updates" />
          <NewsletterInput />
        </div>
      </div>

      {/* Panel 3 */}
      <div className="w-full third-panel-style flex flex-col sm:flex-row text-black" style={{ minHeight: '90vh' }}>
        <div className='w-full sm:w-1/2 relative p-4 flex flex-col items-center justify-center'>
          <Header title="Contact Us" subtitle="Have questions or feedback? Contact us below" />
          <ContactForm />
        </div>
        <div className='w-full sm:w-1/2 relative p-4 flex flex-col items-center justify-center'>
          <div className='flex flex-col items-center justify-center w-full'>
            <Header title="Jump in the pool" />
          </div>
        </div>
      </div>

      {/* Panel 4 */}
      <div className="w-full bg-black flex flex-col-reverse sm:flex-row text-white" style={{ minHeight: '90vh' }}>
        <div className='hidden sm:block sm:w-3/5 relative'>
          <Image
            src="/images/about.jpeg"
            alt="Background"
            fill
            sizes="100vw"
            style={{
              objectFit: "contain"
            }} />
        </div>
        <div className='w-full sm:w-2/5 relative p-4 flex flex-col items-center justify-center'>
          <div className='flex flex-col items-center justify-center w-full'>
            <Header title="About Us" subtitle="Darklake is a privacy-preserving AMM for Solana." isWhite={true} />
            <div className="flex space-x-6">
              <a href="https://twitter.com/blackpooldao" target="_blank" rel="noopener noreferrer" className="text-3xl text-white hover:text-blue-600">
                <i className="fab fa-x-twitter"></i>
              </a>
              <a href="https://github.com/darklakefi" target="_blank" rel="noopener noreferrer" className="text-3xl text-white hover:text-gray-600">
                <i className="fab fa-github"></i>
              </a>
              <a href="https://t.me/blackpoolcapital" target="_blank" rel="noopener noreferrer" className="text-3xl text-white hover:text-blue-400">
                <i className="fab fa-telegram"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
