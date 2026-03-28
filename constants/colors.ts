export const DarkColors = {
    background: '#121212',
    card: '#1E1E1E',
    primary: '#8b5cf6', // Lighter purple for dark mode
    secondary: '#03DAC6',
    accent: '#f59e0b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    success: '#10b981',
    overlay: 'rgba(0,0,0,0.8)',
    input: '#2C2C2C',
    border: 'rgba(255,255,255,0.1)',
    cardSuggest: '#2e1065' // Dark purple
};

export const LightColors = {
    background: '#f8fafc', // Light slate
    card: '#ffffff', // White
    primary: '#7c3aed', // Purple base
    secondary: '#38bdf8', // Light blue
    accent: '#f59e0b', // Orange
    text: '#1e293b',
    textSecondary: '#64748b',
    success: '#10b981',
    overlay: 'rgba(0,0,0,0.4)',
    input: '#f1f5f9',
    border: '#e2e8f0',
    cardSuggest: '#f5f3ff' // Pastel purple for suggest block
};

export type ThemeColors = typeof DarkColors;

// Default export for backward compatibility (optional, or just remove if we update all refs)
export const Colors = DarkColors;

