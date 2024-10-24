'use client';

import { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/ui/header';
import TabbedCards from '@/components/ui/tabbed-cards';
import Image from 'next/image';
import NewsletterInput from '@/components/ui/newsletter-input';
import ContactForm from '@/components/ui/contact-form';
import { Button } from '@/components/ui/button';
import { useSolanaFaucet } from '@/hooks/useSolanaFaucet';
import usePyusdFaucet from '@/hooks/usePyusdFaucet';
import { useTransactionToast, useErrorToast } from '@/hooks/useToast';

export default function LandingPage() {
  const [showBanner, setShowBanner] = useState(true);
  const [currentImage, setCurrentImage] = useState(1);
  const totalImages = 6;
  const wallet = useWallet();
  const { requestPyusd } = usePyusdFaucet();
  const { requestAirdrop } = useSolanaFaucet();
  const showTransactionToast = useTransactionToast();
  const showErrorToast = useErrorToast();

  useEffect(() => {
    const walletAddress = wallet.connected
      ? wallet.publicKey?.toString()
      : null;

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

  const handleSolRequest = async () => {
    if (!wallet.publicKey) {
      showErrorToast('Please connect your wallet first');
      return;
    }
    try {
      const signature = await requestAirdrop(wallet.publicKey);
      showTransactionToast(signature);
    } catch (error) {
      showErrorToast('Failed to request SOL');
    }
  };

  const handlePyusdRequest = async () => {
    if (!wallet.publicKey) {
      showErrorToast('Please connect your wallet first');
      return;
    }
    try {
      const response = await requestPyusd(wallet.publicKey.toString());
      if (response.success) {
        showTransactionToast('PYUSD tokens requested successfully');
      } else {
        showErrorToast(response.message);
      }
    } catch (error) {
      showErrorToast('Failed to request PYUSD');
    }
  };

  return (
    <div className="w-full">
      {/* Banner */}
      {showBanner && (
        <div className="p-4 flex justify-between items-center bg-black text-white">
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
      <div
        className="hero relative w-full flex flex-col items-center justify-center p-4 md:p-8"
        style={{ minHeight: '90vh' }}
      >
        <div className="hero-content w-full max-w-7xl flex flex-col items-center justify-center">
          <div className="z-10 text-center mb-8">
            <Header
              title="Secure. Private. Efficient."
              subtitle="Solana's first DEX delivering real-time, MEV-resistant order execution."
            />
          </div>

          <div className="flex flex-col md:flex-row justify-center items-start gap-8 w-full">
            <div className="w-full md:w-1/2">
              <TabbedCards />
            </div>

            <div className="w-full md:w-1/2 p-8 text-black space-y-6">
              <h2 className="text-3xl font-bold">Welcome to Darklake</h2>
              <p className="text-lg">
                Explore the future of decentralized trading &ndash; now on
                Solana&apos;s devnet.
              </p>

              <div>
                <h3 className="text-2xl font-semibold mb-3">Get Started:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <Button
                      onClick={handlePyusdRequest}
                      disabled={!wallet.connected}
                      className="text-slate-600 hover:text-slate-800 hover:underline"
                    >
                      Get PYUSD test tokens
                    </Button>
                  </li>
                  <li>
                    <Button
                      onClick={handleSolRequest}
                      disabled={!wallet.connected}
                      className="text-slate-600 hover:text-slate-800 hover:underline"
                    >
                      Get SOL test tokens
                    </Button>
                  </li>
                  <li>Start exploring Darklake</li>
                </ul>
              </div>

              <div>
                <p className="mb-2">Stay updated on our mainnet launch:</p>
                <Button
                  className="max-w-md flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-black swap-button-style focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  onClick={scrollToNewsletter}
                >
                  <span className="text-black text-primary-content text-sm">
                    Subscribe to Our Newsletter
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll to learn more */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-black hidden md:block">
          <p className="mb-2">Scroll to learn more</p>
          <i className="fas fa-chevron-down text-2xl animate-bounce"></i>
        </div>
      </div>

      {/* Panel 2 */}
      <div className="flex second-panel-style w-full items-center justify-center min-h-[75vh] p-4 md:p-8">
        <div className="relative w-full max-w-7xl">
          <Image
            src={`/images/explainer/${currentImage}.svg`}
            alt={`Explainer ${currentImage}`}
            width={1920}
            height={1080}
            style={{
              objectFit: 'cover',
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
      <div className="w-full third-panel-style flex flex-col sm:flex-row min-h-[50vh] p-4 md:p-8">
        <div className="w-full sm:w-1/2 p-8 flex flex-col items-center justify-center">
          <Header
            title="Contact Us"
            subtitle="Have questions or feedback? Contact us below"
          />
          <ContactForm />
        </div>
        <div
          id="newsletter-section"
          className="w-full sm:w-1/2 p-8 flex flex-col items-center justify-center"
        >
          <Header
            title="Newsletter"
            subtitle="Sign up with your email address to receive news and updates"
          />
          <NewsletterInput />
        </div>
      </div>

      {/* Panel 4 */}
      <div className="w-full fourth-panel-style flex flex-col-reverse sm:flex-row p-4 md:p-8 bg-black">
        <div className="w-full p-8 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center w-full">
            <div className="flex space-x-8">
              <a
                href="https://twitter.com/darklakefi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-3xl text-white hover:text-blue-600"
              >
                <i className="fab fa-x-twitter"></i>
              </a>
              <a
                href="https://github.com/darklakefi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-3xl text-white hover:text-gray-600"
              >
                <i className="fab fa-github"></i>
              </a>
              <a
                href="https://t.me/darklakefi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-3xl text-white hover:text-blue-400"
              >
                <i className="fab fa-telegram"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
