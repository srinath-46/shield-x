import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create your organization | Shield X',
  description: 'Choose a plan and securely activate your Shield X organization.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}