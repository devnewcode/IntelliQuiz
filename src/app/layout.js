import './globals.css'
import { AuthProvider } from '../lib/authContext'

export const metadata = {
  title: 'IntelliQuiz - Secure Quiz Application',
  description: 'A secure quiz application with user registration and MongoDB integration',
}

export const viewport = {
  themeColor: '#0b0f19',
  colorScheme: 'dark',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ colorScheme: 'dark' }}>
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}