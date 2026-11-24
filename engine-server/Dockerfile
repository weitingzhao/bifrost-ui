# The engine backend runs TypeScript with Node's own type stripping (Node >= 22.18): no build step, no runtime
# dependencies, so the image holds only the source.
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY config ./config
ARG ENGINE_COMMIT=unknown
ARG ENGINE_VERSION=dev
ENV NODE_ENV=production ENGINE_COMMIT=${ENGINE_COMMIT} ENGINE_VERSION=${ENGINE_VERSION} PORT=8796
LABEL io.bifrost.engine.commit=${ENGINE_COMMIT} io.bifrost.engine.version=${ENGINE_VERSION}
USER node
EXPOSE 8796
CMD ["node", "src/main.ts"]
