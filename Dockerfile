FROM node:26-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts index.html ./
COPY client ./client
COPY public ./public
COPY server ./server
COPY tests ./tests
COPY instruments ./instruments
RUN npm run build && npm prune --omit=dev

FROM cloudflare/cloudflared:2026.10.4 AS tunnel

FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 AGORA_DATA_DIR=/app/data
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY server ./server
COPY instruments ./instruments
COPY --from=tunnel /usr/local/bin/cloudflared /usr/local/bin/cloudflared
COPY --from=tunnel /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/main.ts"]
