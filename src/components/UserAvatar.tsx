import { useState } from 'react';

interface UserAvatarProps {
  name?: string | null;
  photoURL?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'CZ';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function UserAvatar({ name, photoURL, size = 'md' }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const dimensions =
    size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'lg'
        ? 'w-14 h-14 text-base'
        : 'w-9 h-9 text-xs';

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={name ? `Foto de perfil de ${name}` : 'Foto de perfil'}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${dimensions} rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${dimensions} rounded-full bg-teal-50 text-teal-800 border border-teal-200/80 font-display font-semibold flex items-center justify-center shrink-0 select-none`}
    >
      {getInitials(name)}
    </div>
  );
}
