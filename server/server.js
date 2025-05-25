const express = require("express")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const fs = require("fs")
const path = require("path")
require("dotenv").config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Data storage files
const DATA_DIR = path.join(__dirname, "data")
const USERS_FILE = path.join(DATA_DIR, "users.json")
const BOOKS_FILE = path.join(DATA_DIR, "books.json")
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json")

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR)
}

// Helper functions for file operations
const readData = (filename) => {
  try {
    if (fs.existsSync(filename)) {
      const data = fs.readFileSync(filename, "utf8")
      return JSON.parse(data)
    }
    return []
  } catch (error) {
    console.error(`Error reading ${filename}:`, error)
    return []
  }
}

const writeData = (filename, data) => {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`Error writing ${filename}:`, error)
  }
}

// Initialize data files with sample data
const initializeData = () => {
  // Sample books
  const sampleBooks = [
    {
      _id: "1",
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      isbn: "9780743273565",
      description:
        "A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream through the eyes of narrator Nick Carraway.",
      genre: "Classic Literature",
      publishedDate: "1925-04-10",
      coverImage: "/placeholder.svg?height=400&width=300",
      featured: true,
      averageRating: 4.2,
      totalReviews: 15,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "2",
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      isbn: "9780061120084",
      description: "A gripping tale of racial injustice and childhood innocence in the American South.",
      genre: "Classic Literature",
      publishedDate: "1960-07-11",
      coverImage: "/placeholder.svg?height=400&width=300",
      featured: true,
      averageRating: 4.5,
      totalReviews: 23,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "3",
      title: "1984",
      author: "George Orwell",
      isbn: "9780451524935",
      description: "A dystopian social science fiction novel about totalitarian control and surveillance.",
      genre: "Science Fiction",
      publishedDate: "1949-06-08",
      coverImage: "/placeholder.svg?height=400&width=300",
      featured: false,
      averageRating: 4.4,
      totalReviews: 31,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "4",
      title: "Pride and Prejudice",
      author: "Jane Austen",
      isbn: "9780141439518",
      description: "A romantic novel that critiques the British landed gentry at the end of the 18th century.",
      genre: "Romance",
      publishedDate: "1813-01-28",
      coverImage: "/placeholder.svg?height=400&width=300",
      featured: true,
      averageRating: 4.3,
      totalReviews: 18,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "5",
      title: "The Catcher in the Rye",
      author: "J.D. Salinger",
      isbn: "9780316769174",
      description: "A controversial novel about teenage rebellion and alienation in post-war America.",
      genre: "Coming of Age",
      publishedDate: "1951-07-16",
      coverImage: "/placeholder.svg?height=400&width=300",
      featured: false,
      averageRating: 3.8,
      totalReviews: 12,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "6",
      title: "Dune",
      author: "Frank Herbert",
      isbn: "9780441172719",
      description: "An epic science fiction novel set in a distant future amidst a feudal interstellar society.",
      genre: "Science Fiction",
      publishedDate: "1965-08-01",
      coverImage: "/placeholder.svg?height=400&width=300",
      featured: true,
      averageRating: 4.6,
      totalReviews: 27,
      createdAt: new Date().toISOString(),
    },
  ]

  // Sample reviews
  const sampleReviews = [
    {
      _id: "1",
      bookId: "1",
      userId: "demo-user",
      rating: 5,
      title: "A Timeless Classic",
      content:
        "Fitzgerald's masterpiece captures the essence of the American Dream and its ultimate futility. The prose is beautiful and the characters are unforgettable.",
      helpful: 12,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "2",
      bookId: "1",
      userId: "demo-user-2",
      rating: 4,
      title: "Great but Overrated",
      content:
        "While beautifully written, I found some parts slow. Still a must-read for understanding American literature.",
      helpful: 8,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "3",
      bookId: "2",
      userId: "demo-user",
      rating: 5,
      title: "Powerful and Moving",
      content:
        "Harper Lee created something truly special. The way she tackles difficult themes through Scout's eyes is brilliant.",
      helpful: 15,
      createdAt: new Date().toISOString(),
    },
  ]

  // Sample users
  const sampleUsers = [
    {
      _id: "demo-user",
      username: "bookworm",
      email: "demo@example.com",
      password: "$2a$10$example", // This would be a real hashed password
      bio: "Avid reader and literature enthusiast",
      avatar: "",
      isAdmin: false,
      createdAt: new Date().toISOString(),
    },
  ]

  // Initialize files if they don't exist
  if (!fs.existsSync(BOOKS_FILE)) {
    writeData(BOOKS_FILE, sampleBooks)
  }
  if (!fs.existsSync(REVIEWS_FILE)) {
    writeData(REVIEWS_FILE, sampleReviews)
  }
  if (!fs.existsSync(USERS_FILE)) {
    writeData(USERS_FILE, sampleUsers)
  }
}

// Initialize data on startup
initializeData()

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.sendStatus(401)
  }

  jwt.verify(token, process.env.JWT_SECRET || "fallback_secret", (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

// Generate unique ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

// Routes

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body

    const users = readData(USERS_FILE)
    const existingUser = users.find((user) => user.email === email || user.username === username)

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = {
      _id: generateId(),
      username,
      email,
      password: hashedPassword,
      bio: "",
      avatar: "",
      isAdmin: false,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    writeData(USERS_FILE, users)

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET || "fallback_secret")
    res.status(201).json({
      token,
      user: { id: newUser._id, username, email },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const users = readData(USERS_FILE)
    const user = users.find((u) => u.email === email)

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "fallback_secret")
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Book Routes
app.get("/api/books", (req, res) => {
  try {
    const { page = 1, limit = 12, search, genre, featured } = req.query
    let books = readData(BOOKS_FILE)

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase()
      books = books.filter(
        (book) => book.title.toLowerCase().includes(searchLower) || book.author.toLowerCase().includes(searchLower),
      )
    }

    if (genre) {
      books = books.filter((book) => book.genre === genre)
    }

    if (featured === "true") {
      books = books.filter((book) => book.featured)
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + Number.parseInt(limit)
    const paginatedBooks = books.slice(startIndex, endIndex)

    res.json({
      books: paginatedBooks,
      totalPages: Math.ceil(books.length / limit),
      currentPage: Number.parseInt(page),
      total: books.length,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/books/:id", (req, res) => {
  try {
    const books = readData(BOOKS_FILE)
    const book = books.find((b) => b._id === req.params.id)

    if (!book) {
      return res.status(404).json({ error: "Book not found" })
    }

    res.json(book)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/books", authenticateToken, (req, res) => {
  try {
    const users = readData(USERS_FILE)
    const user = users.find((u) => u._id === req.user.userId)

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" })
    }

    const books = readData(BOOKS_FILE)
    const newBook = {
      _id: generateId(),
      ...req.body,
      averageRating: 0,
      totalReviews: 0,
      createdAt: new Date().toISOString(),
    }

    books.push(newBook)
    writeData(BOOKS_FILE, books)

    res.status(201).json(newBook)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Review Routes
app.get("/api/reviews", (req, res) => {
  try {
    const { bookId, page = 1, limit = 10 } = req.query
    let reviews = readData(REVIEWS_FILE)
    const users = readData(USERS_FILE)

    if (bookId) {
      reviews = reviews.filter((review) => review.bookId === bookId)
    }

    // Add user information to reviews
    reviews = reviews.map((review) => {
      const user = users.find((u) => u._id === review.userId)
      return {
        ...review,
        userId: user
          ? {
              _id: user._id,
              username: user.username,
              avatar: user.avatar,
            }
          : null,
      }
    })

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + Number.parseInt(limit)
    const paginatedReviews = reviews.slice(startIndex, endIndex)

    res.json({
      reviews: paginatedReviews,
      totalPages: Math.ceil(reviews.length / limit),
      currentPage: Number.parseInt(page),
      total: reviews.length,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/reviews", authenticateToken, (req, res) => {
  try {
    const { bookId, rating, title, content } = req.body

    const reviews = readData(REVIEWS_FILE)
    const books = readData(BOOKS_FILE)
    const users = readData(USERS_FILE)

    // Check if user already reviewed this book
    const existingReview = reviews.find((review) => review.bookId === bookId && review.userId === req.user.userId)
    if (existingReview) {
      return res.status(400).json({ error: "You have already reviewed this book" })
    }

    const newReview = {
      _id: generateId(),
      bookId,
      userId: req.user.userId,
      rating: Number.parseInt(rating),
      title,
      content,
      helpful: 0,
      createdAt: new Date().toISOString(),
    }

    reviews.push(newReview)
    writeData(REVIEWS_FILE, reviews)

    // Update book's average rating
    const bookReviews = reviews.filter((r) => r.bookId === bookId)
    const avgRating = bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length

    const bookIndex = books.findIndex((b) => b._id === bookId)
    if (bookIndex !== -1) {
      books[bookIndex].averageRating = avgRating
      books[bookIndex].totalReviews = bookReviews.length
      writeData(BOOKS_FILE, books)
    }

    // Add user info to response
    const user = users.find((u) => u._id === req.user.userId)
    const reviewWithUser = {
      ...newReview,
      userId: user
        ? {
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
          }
        : null,
    }

    res.status(201).json(reviewWithUser)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// User Routes
app.get("/api/users/:id", (req, res) => {
  try {
    const users = readData(USERS_FILE)
    const user = users.find((u) => u._id === req.params.id)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user
    res.json(userWithoutPassword)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put("/api/users/:id", authenticateToken, (req, res) => {
  try {
    if (req.user.userId !== req.params.id) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    const users = readData(USERS_FILE)
    const userIndex = users.findIndex((u) => u._id === req.params.id)

    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" })
    }

    const { username, bio, avatar } = req.body
    users[userIndex] = {
      ...users[userIndex],
      username: username || users[userIndex].username,
      bio: bio !== undefined ? bio : users[userIndex].bio,
      avatar: avatar !== undefined ? avatar : users[userIndex].avatar,
    }

    writeData(USERS_FILE, users)

    // Remove password from response
    const { password, ...userWithoutPassword } = users[userIndex]
    res.json(userWithoutPassword)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Data stored in: ${DATA_DIR}`)
})