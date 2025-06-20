# Learning Management System (LMS) - Server

A robust and secure RESTful API for a modern Learning Management System built with Node.js, Express, and PostgreSQL.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Instructor, Student)
- Secure password hashing with bcrypt
- Refresh token mechanism

### 📚 Course Management
- CRUD operations for courses, modules, and lessons
- Course categorization and filtering
- Search and filtering capabilities
- File uploads for course materials

### 🎓 Learning Experience
- User enrollment and progress tracking
- Quiz and assessment system
- Assignment submissions and grading
- Discussion forums

### 🛡️ Security
- SQL injection protection
- Rate limiting
- CORS protection
- Request validation
- Secure headers (Helmet)
- Input sanitization

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT, bcrypt
- **Security**: Helmet, express-rate-limit, cors
- **File Uploads**: Multer
- **Validation**: Joi
- **Logging**: Winston
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm (v9 or higher) or yarn
- Git

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/online-lms.git
   cd online-lms/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env` file in the server directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   
   # Database
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASS=your_db_password
   DB_NAME=lms_db
   
   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=30d
   JWT_COOKIE_EXPIRES=30
   
   # File Uploads
   MAX_FILE_UPLOAD=10
   FILE_UPLOAD_PATH=./public/uploads
   
   # Email (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_EMAIL=your_email@gmail.com
   SMTP_PASSWORD=your_email_password
   ```

4. **Database Setup**
   - Create a new PostgreSQL database
   - Update the database credentials in the `.env` file
   - Run migrations:
     ```bash
     npx sequelize-cli db:migrate
     ```
   - (Optional) Seed the database with initial data:
     ```bash
     npx sequelize-cli db:seed:all
     ```

5. **Start the development server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```
   The API will be available at `http://localhost:5000`

## API Documentation

API documentation is available at `/api-docs` when the server is running in development mode. The documentation is generated using Swagger/OpenAPI.

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # Route definitions
├── services/        # Business logic
├── utils/           # Utility functions
├── validators/      # Request validators
└── app.js           # Express application
```

## Development

- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
- **Running tests**: `npm test`

## Deployment

1. Set `NODE_ENV=production` in your environment variables
2. Install production dependencies:
   ```bash
   npm ci --only=production
   ```
3. Run database migrations:
   ```bash
   npx sequelize-cli db:migrate
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
   ```bash
   git clone [your-repository-url]
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=postgresql://username:password@localhost:5432/lms_db
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=1d
   BCRYPT_SALT_ROUNDS=10
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   CORS_ORIGIN=http://localhost:3000
   SESSION_SECRET=your_session_secret
   ```

4. **Database Setup**
   - Create a new PostgreSQL database
   - Run the database migrations (if any)

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: `http://localhost:5000/api-docs`
- API Base URL: `http://localhost:5000/api`

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Lint the codebase
- `npm run format` - Format the code using Prettier

## Project Structure

```
server/
├── config/           # Configuration files
│   ├── db.js         # Database configuration
│   ├── passport.js   # Passport authentication
│   └── multer.js     # File upload configuration
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/           # Database models
├── routes/           # API routes
├── uploads/          # Uploaded files
├── utils/            # Utility functions
├── .env              # Environment variables
├── app.js            # Express application
└── server.js         # Server entry point
```

## Security Considerations

- All database queries use parameterized queries to prevent SQL injection
- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Rate limiting is implemented to prevent brute force attacks
- CORS is properly configured
- Secure headers are set using Helmet

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

Built with ❤️ by [Your Name]
