FROM node:22-alpine AS build
WORKDIR /repo
RUN apk add --no-cache python3 make g++ libc6-compat
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build the shared package first so its compiled JS+d.ts exist before the
# api's tsc + runtime resolve `@dalkong/shared` (which now points at dist/).
RUN cd packages/shared && npm install --no-audit --no-fund && npm run build

WORKDIR /repo/apps/api
RUN npm install --no-audit --no-fund
RUN npm run build
# tsc doesn't copy non-TS assets; bundle the SQL migrations into dist/.
RUN cp -r src/db/migrations dist/db/migrations

FROM node:22-alpine AS runtime
WORKDIR /repo/apps/api
ENV NODE_ENV=production
RUN apk add --no-cache tini
# Copy the shared package's compiled output AND its node_modules layout so
# the file: link in apps/api/node_modules/@dalkong/shared can resolve.
COPY --from=build /repo/packages/shared /repo/packages/shared
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/package.json ./package.json
COPY --from=build /repo/apps/api/package-lock.json* ./
COPY --from=build /repo/apps/api/node_modules ./node_modules
EXPOSE 3001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
