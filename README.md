 Tech Stack

Frontend:

React.js (with Vite)

TailwindCSS

Axios

React Router DOM

Backend:

Node.js

Express.js

MongoDB (with Mongoose)

JWT Authentication

dotenv for environment variables

Deployment:

Render (Backend)

Vercel or Netlify (Frontend)

MongoDB Atlas (Database)

 Features

User Authentication (Register/Login)
Admin Dashboard to manage hotels and rooms
 Add, Update, Delete Hotels and Rooms
View all uploaded hotels
JWT-based authentication and route protection
 Category-wise and total data summary

 Setup Instructions
 1. Clone Repositories
# Backend
git clone https://github.com/your-username/hotel-booking-backend.git
cd backend
npm install

# Frontend
git clone https://github.com/your-username/hotel-booking-frontend.git
cd -frontend
npm install

 2. Setup Environment Variables

In backend folder, create a .env file:

PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
NODE_ENV=development

 3. Run Locally

Backend:

npm start


Frontend:

npm run dev


Open in browser:
 Frontend: http://localhost:5173
 Backend API: http://localhost:5000