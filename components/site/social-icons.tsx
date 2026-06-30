type IconProps = { className?: string };

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.9 2H22l-7.6 8.7L22.6 22h-6.9l-5.4-7-6.2 7H1l8.1-9.3L1.7 2h7.1l4.9 6.4L18.9 2zm-2.4 18h1.9L7.6 4h-2L16.5 20z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23 12s0-3.2-.4-4.7c-.3-.9-1-1.6-1.9-1.8C18.9 5 12 5 12 5s-6.9 0-8.7.5c-.9.2-1.6.9-1.9 1.8C1 8.8 1 12 1 12s0 3.2.4 4.7c.3.9 1 1.6 1.9 1.8C5.1 19 12 19 12 19s6.9 0 8.7-.5c.9-.2 1.6-.9 1.9-1.8.4-1.5.4-4.7.4-4.7zM10 15.5v-7l6 3.5-6 3.5z" />
    </svg>
  );
}
