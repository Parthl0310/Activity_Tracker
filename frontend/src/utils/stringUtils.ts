export const getInitials = (name?: string): string => {
  if (!name || typeof name !== 'string') return 'US';
  
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'US';

  const parts = trimmed.split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
