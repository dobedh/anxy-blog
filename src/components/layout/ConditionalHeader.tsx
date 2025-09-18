'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();

  // Don't show the main header on write page
  if (pathname === '/write') {
    return null;
  }

  return <Header />;
}