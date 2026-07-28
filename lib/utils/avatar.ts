export function generateInitialsAvatar(name: string, email: string): string {
  const initials = getInitials(name || email);
  const bgColor = '#19322F';
  const textColor = '#ffffff';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${bgColor}"/>
      <text x="50" y="50" font-family="Arial, sans-serif" font-size="40" font-weight="600" fill="${textColor}" text-anchor="middle" dominant-baseline="central">${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function getInitials(nameOrEmail: string): string {
  if (!nameOrEmail) return 'U';
  
  const parts = nameOrEmail.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  return nameOrEmail.substring(0, 2).toUpperCase();
}
