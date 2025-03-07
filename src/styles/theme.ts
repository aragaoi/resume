export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    mutedText: string;
    accent: string;
    border: string;
    surface: string;
  };
  typography: {
    fontFamily: string;
    headerFontFamily: string;
    baseFontSize: string;
    lineHeight: string;
  };
  spacing: {
    base: string;
    small: string;
    medium: string;
    large: string;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
}

export const defaultTheme: ThemeConfig = {
  colors: {
    primary: '#1a5f7a',
    secondary: '#457b9d',
    background: '#ffffff',
    text: '#2c3e50',
    mutedText: '#64748b',
    accent: '#e63946',
    border: '#e2e8f0',
    surface: '#f8fafc',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    headerFontFamily:
      "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    baseFontSize: '16px',
    lineHeight: '1.6',
  },
  spacing: {
    base: '1rem',
    small: '0.5rem',
    medium: '1.5rem',
    large: '2rem',
  },
  borderRadius: {
    small: '0.25rem',
    medium: '0.5rem',
    large: '1rem',
  },
};
