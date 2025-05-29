const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const spController = require('./routes/spController');
const classRoutes = require('./routes/class');
const rewards = require('./routes/rewards');
const searchRoutes = require('./routes/search'); 
const skillRoutes = require('./routes/skill'); 
const requestRoutes = require('./routes/request');
const commentRoutes = require('./routes/comment');
const passport = require("passport");
const session = require('express-session'); // <-- Ajout de cet import
const path = require('path'); 
const winston = require('winston');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

require("./utils/passport");

const app = express();

const notificationRoutes = require("./routes/notification");
app.use("/api/notifications", notificationRoutes);
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" })
  ]
});


app.use(express.json());

app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later."
});

app.use("/api/", apiLimiter);

app.use(session({
  secret: process.env.JWT_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());


// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use('/uploads/profile_pictures', express.static(path.join(__dirname, 'uploads', 'profile_pictures')));


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/sp', spController); 
app.use('/api/class', classRoutes);
app.use('/api/rewards', rewards);
app.use('/api/search', searchRoutes); 
app.use('/api/skill', skillRoutes);
app.use('/api/request', requestRoutes);
app.use('/api/comment',commentRoutes);


// Use the correct port from environment variables or default to 80
const PORT = process.env.PORT || 80;

// Authenticate and sync database
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    return sequelize.sync();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
  });
