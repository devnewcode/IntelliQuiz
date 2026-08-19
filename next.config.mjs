/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'jsonwebtoken',
    'bcryptjs',
    'mongoose',
    'pdfjs-dist',
  ],
}

export default nextConfig
