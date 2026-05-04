FROM node:22-alpine AS build
WORKDIR /repo
RUN apk add --no-cache python3 make g++ libc6-compat
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
WORKDIR /repo/apps/api
RUN npm install --no-audit --no-fund
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /repo/apps/api
ENV NODE_ENV=production
RUN apk add --no-cache tini
COPY --from=build /repo/packages/shared /repo/packages/shared
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/package.json ./package.json
COPY --from=build /repo/apps/api/package-lock.json* ./
COPY --from=build /repo/apps/api/node_modules ./node_modules
EXPOSE 3001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
