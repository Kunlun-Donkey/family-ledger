import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs', 'better-sqlite3'],
  output: 'standalone',
}

export default nextConfig
