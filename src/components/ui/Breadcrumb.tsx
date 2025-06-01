import React from 'react';
import Link from 'next/link';
import { FaChevronRight, FaHome } from 'react-icons/fa';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`} aria-label="Breadcrumb">
      <Link href="/" className="flex items-center hover:text-green-600 transition-colors">
        <FaHome className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <FaChevronRight className="h-3 w-3 text-gray-400" />
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-green-600 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
