export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div
      className={`${sizes[size]} border-2 border-accent-200 border-t-accent-600 rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
