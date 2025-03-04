'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider, createTheme } from '@mui/material/styles';

const inter = Inter({ subsets: ["latin"] });

const theme = createTheme({
  palette: {
    primary: {
      main: '#000000',
    },
  },
  components: {
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '50px',
        },
      },
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
} 