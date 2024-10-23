import './global.css';
import { UiLayout } from '@/components/ui/ui-layout';
import { ClusterProvider } from '@/components/cluster/cluster-data-access';
import { SolanaProvider } from '@/components/solana/solana-provider';
import { ReactQueryProvider } from './react-query-provider';
import { CSPostHogProvider } from './providers';
import { Analytics } from "@vercel/analytics/react"

export const metadata = {
  title: 'Darklake',
  description: 'A privacy-preserving AMM.',
};

const links: { label: string; path: string }[] = [
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
        <script src="/js/snarkjs.min.js" async/>
      </head>
      <body>
        <CSPostHogProvider>
          <ReactQueryProvider>
            <ClusterProvider>
              <SolanaProvider>
                <UiLayout links={links}>{children}</UiLayout>
              </SolanaProvider>
            </ClusterProvider>
          </ReactQueryProvider>
        </CSPostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
