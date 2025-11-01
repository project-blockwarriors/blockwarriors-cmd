'use client';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';

/**
 * Example component demonstrating Convex integration in Next.js
 * This shows how to use the useQuery hook to fetch data from Convex
 */
export function ConvexExample() {
  const result = useQuery(api.example.example);

  if (result === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Convex Test</h3>
      <p>{result.message}</p>
    </div>
  );
}
