'use client';

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { navigateTo } from '@/lib/navigate';

type HardLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  children: ReactNode;
};

/** Internal link that uses full-page navigation instead of the App Router client transition. */
export default function HardLink({ href, onClick, children, ...rest }: HardLinkProps) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        navigateTo(href);
      }}
    >
      {children}
    </a>
  );
}
