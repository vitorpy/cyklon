'use client';

import './ui-layout.css'; // Add this line to import the new CSS file

import { WalletButton } from '../solana/solana-provider';
import * as React from 'react';
import { ReactNode, Suspense } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AccountChecker } from '../account/account-ui';
import {
  ClusterChecker,
  ClusterUiSelect,
} from '../cluster/cluster-ui';
import { Toaster } from 'react-hot-toast';

export function UiLayout({
  children,
  links,
}: {
  children: ReactNode;
  links: { label: string; path: string }[];
}) {
  const pathname = usePathname();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="navbar bg-base-300 text-neutral-content flex-wrap justify-between p-2">
        <div className="flex-1 flex items-center">
          <Link className="btn btn-ghost normal-case text-xl" href="/">
            <p className="font-normal header-title-text text-white">Darklake</p>
          </Link>
        </div>
        <div className="flex-none flex items-center space-x-2">
          <WalletButton />
          <ClusterUiSelect />
        </div>
        <div className="w-full mt-2">
          <ul className="menu menu-horizontal px-1 flex-wrap justify-center">
            {links.map(({ label, path }) => (
              <li key={path}>
                <Link
                  className={pathname.startsWith(path) ? 'active' : ''}
                  href={path}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ClusterChecker>
        <AccountChecker />
      </ClusterChecker>
      <div className="flex-grow flex bg-white overflow-auto">
        <Suspense
          fallback={
            <div className="text-center my-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          }
        >
          {children}
        </Suspense>
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
}

export function ellipsify(str = '', len = 4) {
  if (str.length > 30) {
    return (
      str.substring(0, len) + '..' + str.substring(str.length - len, str.length)
    );
  }
  return str;
}
