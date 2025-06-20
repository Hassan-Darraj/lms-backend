# Learning Management System (LMS) - Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/yourusername/online-lms?style=social)](https://github.com/yourusername/online-lms/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/online-lms)](https://github.com/yourusername/online-lms/issues)
[![Node.js CI](https://github.com/yourusername/online-lms/actions/workflows/node.js.yml/badge.svg)](https://github.com/yourusername/online-lms/actions/workflows/node.js.yml)

This is the backend API for the Learning Management System (LMS) built with Node.js, Express, and PostgreSQL.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm (v9 or higher) or yarn
- Git

### Installation

1. **Fork the repository**
   Click the "Fork" button at the top-right of this repository page.

2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/online-lms.git
   cd online-lms/server
   ```

3. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

4. **Environment Setup**
   Create a `.env` file in the server directory (use `.env.example` as reference):
   ```env
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
   ```

5. **Database Setup**
   - Create a new PostgreSQL database
   - Run migrations:
     ```bash
     npx sequelize-cli db:migrate
     ```
   - (Optional) Seed the database:
     ```bash
     npx sequelize-cli db:seed:all
     ```

6. **Start the development server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:5000`

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🤝 Contributing

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Write tests for new features
   - Update API documentation
   - Update environment variables in `.env.example` if needed

3. **Run linter and tests**
   ```bash
   npm run lint
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(server): add your feature description"
   ```

5. **Push to the branch**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Go to the [GitHub repository](https://github.com/yourusername/online-lms)
   - Click "New Pull Request"
   - Select your branch
   - Add a clear title and description
   - Submit the pull request

## 🐛 Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/yourusername/online-lms/issues/new/choose).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- All contributors who have helped improve this project
