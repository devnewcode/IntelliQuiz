/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'jsonwebtoken',
    'bcryptjs',
    'mongoose',
    'pdfjs-dist',
    '@napi-rs/canvas',
  ],
}

export default nextConfig