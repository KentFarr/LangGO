import { createGlobalStyle } from 'styled-components';

export const colors = {
  primary: '#495E57',
  primaryLight: '#6B8F71',
  accent: '#F4CE14',
  background: '#F5F7F8',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F4F4',
  text: '#45474B',
  danger: '#DC3545',
} as const;

export const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${colors.background};
    color: ${colors.text};
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Hiragino Sans', 'Noto Sans JP', sans-serif;
  }

  /* Brand the Bootstrap buttons used throughout the app. */
  .btn-primary {
    --bs-btn-bg: ${colors.primary};
    --bs-btn-border-color: ${colors.primary};
    --bs-btn-hover-bg: ${colors.primaryLight};
    --bs-btn-hover-border-color: ${colors.primaryLight};
    --bs-btn-active-bg: ${colors.primaryLight};
    --bs-btn-active-border-color: ${colors.primaryLight};
    --bs-btn-disabled-bg: ${colors.primary};
    --bs-btn-disabled-border-color: ${colors.primary};
  }

  .btn-outline-primary {
    --bs-btn-color: ${colors.primary};
    --bs-btn-border-color: ${colors.primary};
    --bs-btn-hover-bg: ${colors.primary};
    --bs-btn-hover-border-color: ${colors.primary};
    --bs-btn-active-bg: ${colors.primary};
    --bs-btn-active-border-color: ${colors.primary};
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
`;
