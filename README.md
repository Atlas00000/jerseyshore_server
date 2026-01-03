# 🚀 Server Application

<div align="center">

**Express.js Backend API for Shirt Configurator**

[![Express](https://img.shields.io/badge/Express-4.18-green?style=flat-square&logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-orange?style=flat-square&logo=cloudflare)](https://www.cloudflare.com/products/r2/)

[API Documentation](#-api-documentation) • [Setup](#-setup) • [Testing](#-testing) • [Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [API Endpoints](#-api-endpoints)
- [Services](#-services)
- [Setup & Development](#-setup--development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Logging & Monitoring](#-logging--monitoring)

---

## 🎯 Overview

The server application provides a RESTful API for the shirt configurator, handling file uploads, asset management, and integration with Cloudflare R2 storage. Built with Express.js and TypeScript, it delivers a robust, scalable backend.

### Key Features

- **File Upload API** - Handle print image uploads
- **Cloudflare R2 Integration** - S3-compatible object storage
- **RESTful Architecture** - Clean, predictable API design
- **Type Safety** - Full TypeScript implementation
- **Comprehensive Logging** - Request/response logging
- **Error Handling** - Robust error management

---

## 🏗️ Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Express.js 4.18                       │
├─────────────────────────────────────────────────────────┤
│  TypeScript 5.3  │  Node.js 18+  │  ES Modules         │
├─────────────────────────────────────────────────────────┤
│  AWS SDK (R2)  │  Multer  │  CORS  │  UUID            │
└─────────────────────────────────────────────────────────┘
```

### Project Structure

```
server/
├── src/
│   ├── server.ts           # Express app setup
│   ├── controllers/         # Request handlers
│   │   └── printController.ts
│   ├── routes/             # Route definitions
│   │   └── prints.ts
│   ├── services/           # Business logic
│   │   └── cloudflareService.ts
│   └── utils/              # Utilities
│       ├── logger.ts
│       └── logging/
│
├── scripts/                # Utility scripts
│   ├── uploadModel.ts
│   ├── uploadMaterials.ts
│   └── testR2Connection.ts
│
├── dist/                   # Compiled output
└── logs/                   # Application logs
```

### Request Flow

```
Client Request
    │
    ▼
Express Middleware
    │
    ▼
Route Handler
    │
    ▼
Controller
    │
    ▼
Service Layer
    │
    ▼
Cloudflare R2 / External API
    │
    ▼
Response
```

---

## 📡 API Endpoints

### Base URL

```
Development: http://localhost:3001
Production: https://api.yourdomain.com
```

### Endpoints

#### **POST /api/prints/upload**

Upload a print image to R2 storage.

**Request:**
```http
POST /api/prints/upload
Content-Type: multipart/form-data

{
  "image": File (PNG, JPEG, JPG, WebP)
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://your-bucket.r2.dev/prints/user-uploads/uuid.png",
  "fileName": "prints/user-uploads/uuid.png"
}
```

**Error Responses:**
- `400` - No file provided
- `400` - Invalid file type
- `400` - File too large (>5MB)
- `500` - Upload failed

**Example:**
```bash
curl -X POST http://localhost:3001/api/prints/upload \
  -F "image=@/path/to/image.png"
```

### Health Check

#### **GET /health**

Server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.67
}
```

---

## 🔧 Services

### Cloudflare R2 Service

S3-compatible object storage integration.

**Key Methods:**

```typescript
// Upload file to R2
uploadToR2(fileName: string, buffer: Buffer, contentType: string): Promise<string>

// Generate presigned URL
getPresignedUrl(fileName: string, expiresIn: number): Promise<string>

// Delete file from R2
deleteFromR2(fileName: string): Promise<void>
```

**Configuration:**

Environment variables required:
```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

---

## 🚀 Setup & Development

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+
- **Cloudflare R2** account (for storage)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables

Create `.env` file:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Server Configuration
PORT=3001
NODE_ENV=development

# Logging
LOG_DIR=./logs
LOG_FORMAT=json
ENABLE_FILE_LOGGING=true
```

### Development Workflow

1. **Start dev server**: `pnpm dev` (uses `tsx watch` for hot reload)
2. **API available**: http://localhost:3001
3. **Auto-reload**: Changes trigger server restart
4. **Type checking**: TypeScript compilation

### Scripts

```bash
# Development
pnpm dev              # Start with hot reload

# Build
pnpm build            # Compile TypeScript

# Production
pnpm start            # Run compiled server

# Utilities
pnpm upload-model     # Upload 3D model to R2
```

---

## 🧪 Testing

### Testing Strategy

#### **Unit Tests**

Test individual functions and utilities:

```typescript
// Example: Service test
describe('cloudflareService', () => {
  it('uploads file successfully', async () => {
    const url = await uploadToR2('test.png', buffer, 'image/png');
    expect(url).toContain('r2.dev');
  });
});
```

#### **Integration Tests**

Test API endpoints:

```typescript
// Example: API test
describe('POST /api/prints/upload', () => {
  it('uploads file and returns URL', async () => {
    const response = await request(app)
      .post('/api/prints/upload')
      .attach('image', testImageBuffer);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

#### **E2E Tests**

Test complete workflows:

```typescript
// Example: E2E test
test('upload and retrieve print', async () => {
  // Upload file
  const uploadResponse = await uploadPrint(testFile);
  
  // Verify file exists
  const fileExists = await checkFileExists(uploadResponse.fileName);
  expect(fileExists).toBe(true);
});
```

### Test Coverage Goals

- **Unit Tests**: 85%+ coverage
- **Integration Tests**: All endpoints covered
- **E2E Tests**: Critical workflows covered

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run specific test file
pnpm test printController.test.ts
```

### Testing Best Practices

1. **Mock external services** (R2, APIs)
2. **Test error cases** (invalid input, network failures)
3. **Test edge cases** (large files, special characters)
4. **Use fixtures** for test data
5. **Clean up** after tests (delete uploaded files)
6. **Test security** (file type validation, size limits)

---

## 📦 Deployment

### Production Build

```bash
# Compile TypeScript
pnpm build

# Output in dist/
ls dist/
```

### Docker Deployment

```bash
# Build image
docker build -t shirt-configurator-server .

# Run container
docker run -p 3001:3001 \
  -e R2_ACCOUNT_ID=your_id \
  -e R2_ACCESS_KEY_ID=your_key \
  -e R2_SECRET_ACCESS_KEY=your_secret \
  shirt-configurator-server
```

### Platform Deployment

#### **Railway**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway up
```

#### **Render**

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

#### **Fly.io**

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly deploy
```

#### **AWS EC2**

```bash
# SSH into server
ssh user@your-server

# Clone repository
git clone <repo-url>

# Install dependencies
cd server && pnpm install

# Build
pnpm build

# Start with PM2
pm2 start dist/server.js
```

### Environment Variables

Ensure all required environment variables are set in production:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `PORT` (default: 3001)
- `NODE_ENV=production`

---

## 📊 Logging & Monitoring

### Logging System

Comprehensive logging with multiple levels:

```typescript
// Log levels
logger.info('Request received', { metadata });
logger.warn('File size warning', { metadata });
logger.error('Upload failed', { error, metadata });
logger.debug('Debug information', { metadata });
```

### Log Formats

- **JSON** - Structured logging (production)
- **Pretty** - Human-readable (development)

### Log Files

Logs are written to:
- **Console** - Standard output
- **File** - `logs/app.log` (if enabled)
- **Error Log** - `logs/error.log`

### Monitoring

**Key Metrics:**
- Request count
- Response times
- Error rates
- File upload success rate
- R2 API call latency

**Health Checks:**
- `/health` endpoint for uptime monitoring
- Database connection status
- R2 connectivity status

---

## 🔒 Security

### File Upload Security

- **File Type Validation** - Only allowed image types
- **File Size Limits** - Maximum 5MB
- **Filename Sanitization** - Prevent path traversal
- **UUID Generation** - Unique, unpredictable filenames

### Best Practices

1. **Environment Variables** - Never commit secrets
2. **CORS Configuration** - Restrict origins
3. **Rate Limiting** - Prevent abuse (recommended)
4. **Input Validation** - Validate all inputs
5. **Error Messages** - Don't expose sensitive info

---

## 🛠️ Utilities

### Upload Scripts

**Upload 3D Model:**
```bash
pnpm upload-model path/to/model.glb
```

**Upload Materials:**
```bash
tsx scripts/uploadMaterials.ts
```

**Test R2 Connection:**
```bash
tsx scripts/testR2Connection.ts
```

---

## 📚 Additional Resources

- **[Main README](../README.md)** - Project overview
- **[Client README](../client/README.md)** - Frontend documentation
- **[Contributing](../CONTRIBUTING.md)** - Development guidelines
- **[Testing](../TESTING.md)** - Testing strategy

---

## 🐛 Troubleshooting

### Common Issues

**R2 Connection Failed:**
- Verify environment variables
- Check R2 credentials
- Test connection with `testR2Connection.ts`

**File Upload Fails:**
- Check file size (max 5MB)
- Verify file type (PNG, JPEG, JPG, WebP)
- Check R2 bucket permissions

**Server Won't Start:**
- Verify Node.js version (18+)
- Check port availability (3001)
- Review error logs

---

<div align="center">

**Robust, scalable backend API**

[Report Issues](https://github.com/your-repo/issues) • [Contribute](../CONTRIBUTING.md)

</div>

