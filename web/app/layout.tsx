import './global.css';
import { UiLayout } from '@/components/ui/ui-layout';
import { ClusterProvider } from '@/components/cluster/cluster-data-access';
import { SolanaProvider } from '@/components/solana/solana-provider';
import { ReactQueryProvider } from './react-query-provider';
import { CSPostHogProvider } from './providers';

export const metadata = {
  title: 'Blackpool',
  description: 'A privacy-preserving AMM by Blackpool Capital.',
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
      </body>
    </html>
  );
}
