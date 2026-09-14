import type { Metadata } from 'next';
import '../../styles/marketing/auth.css';

export const metadata: Metadata = {
  title: 'Sign in | Shield X',
  description: 'Securely sign in to your authorized Shield X workspace.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}