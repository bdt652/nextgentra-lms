import sharedConfig from '@nextgentra/config/tailwind/shared';

/** @type {import('tailwindcss').Config} */
const config = {
  ...sharedConfig,
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    '../../packages/ui/**/*.{ts,tsx}',
  ],
};

export default config;
