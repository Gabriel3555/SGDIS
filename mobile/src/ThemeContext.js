import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('isDarkMode');
        if (storedTheme !== null) {
          setIsDarkMode(JSON.parse(storedTheme));
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newMode));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = {
    background: isDarkMode ? '#121212' : '#fff',
    card: isDarkMode ? '#1e1e1e' : '#fff',
    text: isDarkMode ? '#fff' : '#222',
    subtitle: isDarkMode ? '#bbb' : '#28a745',
    institution: isDarkMode ? '#aaa' : '#555',
    inputBackground: isDarkMode ? '#2a2a2a' : '#f9f9f9',
    inputBorder: isDarkMode ? '#555' : '#ccc',
    inputBorderFocus: '#28a745',
    buttonBackground: '#28a745',
    buttonText: '#fff',
    link: '#28a745',
    registerText: isDarkMode ? '#ccc' : '#333',
    footer: isDarkMode ? '#777' : '#999',
    icon: isDarkMode ? '#ccc' : '#999',
    placeholder: isDarkMode ? '#777' : '#999',
    statCard1: isDarkMode ? '#1e3a5f' : '#e3f2fd', // Dark blue for light blue
    statCard2: isDarkMode ? '#2e4d32' : '#e8f5e8', // Dark green for light green
    statCard3: isDarkMode ? '#5d4037' : '#fff3e0', // Dark brown for light orange
    statCard4: isDarkMode ? '#4a148c' : '#f3e5f5', // Dark purple for light purple
    categoryCard1: isDarkMode ? '#4a148c' : '#ffebee', // Dark red for light red
    categoryCard2: isDarkMode ? '#5d4037' : '#fff3e0', // Dark orange for light orange
    categoryCard3: isDarkMode ? '#2e4d32' : '#e8f5e8', // Dark green for light green
    categoryCard4: isDarkMode ? '#1e3a5f' : '#e3f2fd', // Dark blue for light blue
    actionCard1: isDarkMode ? '#1e3a5f' : '#e3f2fd', // Same as statCard1
    actionCard2: isDarkMode ? '#2e4d32' : '#e8f5e8', // Same as statCard2
    actionCard3: isDarkMode ? '#4a148c' : '#f3e5f5', // Same as statCard4
    actionCard4: isDarkMode ? '#5d4037' : '#fff3e0', // Same as statCard3
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};