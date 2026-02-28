/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        resolveAlias: {
            canvas: './nomodule.js',
        },
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    },
};

export default nextConfig;
