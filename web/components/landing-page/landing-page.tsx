'use client';

import { useState, useEffect } from 'react';
import { Header } from '../ui/header';
import { SolanaSwapComponent } from '../solana-swapper/solana-swap';
import Image from "next/image";
import NewsletterInput from '../ui/newsletter-input';
import ContactForm from '../ui/contact-form';

export default function LandingPage() {
  const [currentPanel, setCurrentPanel] = useState(0);

  const panels = [
    // Panel 1: Current content
    <div key={0} className="flex w-full h-full">
      <div className="w-full sm:w-1/3 overflow-y-auto px-4">
        <Header title="Secure. Private. Efficient." subtitle="Blackpool: Advanced privacy-preserving trading platform powered by Solana technology." />
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
    </div>,
    // Panel 2: New content
    <div key={1} className="flex w-full h-full second-panel-style">
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
    </div>,
    // Panel 3: New content
    <div key={2} className="w-full h-full third-panel-style flex flex-col sm:flex-row text-black">
      <div className='w-full sm:w-1/2 relative p-4 flex flex-col items-center justify-center'>
        <Header title="Contact Us" subtitle="Have questions or feedback? Contact us below" />
        <ContactForm />
      </div>
      <div className='w-full sm:w-1/2 relative p-4 flex flex-col items-center justify-center'>
        <div className='flex flex-col items-center justify-center w-full'>
          <Header title="Jump in the pool" />
        </div>
      </div>
    </div>,
    // Panel 4: Updated content
    <div key={3} className="w-full h-full bg-black flex flex-col-reverse sm:flex-row text-white">
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
          <Header title="About Us" subtitle="Blackpool is a privacy-preserving AMM for Solana." isWhite={true} />
          <div className="flex space-x-6">
            <a href="https://twitter.com/blackpooldao" target="_blank" rel="noopener noreferrer" className="text-3xl text-white hover:text-blue-600">
              <i className="fab fa-x-twitter"></i>
            </a>
            <a href="https://github.com/blackpooldao" target="_blank" rel="noopener noreferrer" className="text-3xl text-white hover:text-gray-600">
              <i className="fab fa-github"></i>
            </a>
            <a href="https://t.me/blackpoolcapital" target="_blank" rel="noopener noreferrer" className="text-3xl text-white hover:text-blue-400">
              <i className="fab fa-telegram"></i>
            </a>
          </div>
        </div>
      </div>
    </div>,
  ];

  const handleScroll = (direction: 'up' | 'down') => {
    setCurrentPanel((prev) => {
      if (direction === 'up') return (prev - 1 + panels.length) % panels.length;
      return (prev + 1) % panels.length;
    });
  };

  useEffect(() => {
    const handleWheelScroll = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        handleScroll('down');
      } else {
        handleScroll('up');
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        handleScroll('up');
      } else if (e.key === 'ArrowDown') {
        handleScroll('down');
      }
    };

    window.addEventListener('wheel', handleWheelScroll);
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('wheel', handleWheelScroll);
      window.removeEventListener('keydown', handleKeyPress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateY(-${currentPanel * 100}%)` }}
      >
        {panels.map((panel, index) => (
          <div key={index} className="w-full h-full">
            {panel}
          </div>
        ))}
      </div>
      <button
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-2 shadow-md"
        onClick={() => handleScroll('up')}
      >
        ▲
      </button>
      <button
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-2 shadow-md"
        onClick={() => handleScroll('down')}
      >
        ▼
      </button>
    </div>
  );
}
