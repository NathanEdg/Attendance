/** @type {import('next').NextConfig} */
import nextEnv from '@next/env'
import path from 'path'
import { fileURLToPath } from 'url'

const { loadEnvConfig } = nextEnv

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Load env files from the monorepo root (two levels up from apps/web)
loadEnvConfig(path.resolve(__dirname, '../..'))

const nextConfig = {
  transpilePackages: ["@workspace/ui"],
}

export default nextConfig
