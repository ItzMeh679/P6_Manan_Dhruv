FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

# Install dependencies including devDependencies (needed for drizzle-kit)
RUN npm install

COPY . .

# Generate the SQL migration files (if not generated locally)
RUN npx drizzle-kit generate

# Build arguments
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build the application
RUN npm run build

# Push Drizzle schema to database, then start
CMD ["sh", "-c", "npx drizzle-kit push --force && npm run start"]
