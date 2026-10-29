/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['jsonwebtoken', 'bcryptjs', 'mongoose', 'pdf-parse']
}

export default nextConfig;
