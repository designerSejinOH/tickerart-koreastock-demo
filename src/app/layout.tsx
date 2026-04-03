import type { Metadata } from 'next';
import { IBM_Plex_Mono, Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
});

const notoSansKR = Noto_Sans_KR({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: '주식 시세 전체 리스트',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${ibmPlexMono.variable} ${notoSansKR.variable}`}>
        {children}
      </body>
    </html>
  );
}
