import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kilovatio – Control de Consumo Eléctrico',
  description: 'Registra y analiza el consumo de kilowatios-hora por mes y apartamento.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ThemeProvider>
          <Navbar />
          <div className="page-wrapper">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
