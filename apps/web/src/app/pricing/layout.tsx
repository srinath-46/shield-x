import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Shield X',
  description: 'Choose a Shield X plan for your organization, workforce, and worksites.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}