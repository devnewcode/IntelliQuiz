import './globals.css'
import { AuthProvider } from '../lib/authContext'

export const metadata = {
  title: 'IntelliQuiz - Secure Quiz Application',
  description: 'A secure quiz application with user registration and MongoDB integration',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}