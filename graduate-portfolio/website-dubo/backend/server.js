const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();




// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Same-origin development server; no VS Code Live Server, CORS or proxy required.

// Middleware for JSON parsing
app.use(express.json());

// Block requests for backend source and private JSON data.
app.use('/backend', (req, res) => res.sendStatus(404));

// Serve static files from the project root directory
app.use(express.static(path.join(__dirname, '..')));

// Moved to end of file to prevent intercepting API POST requests

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        console.log('Saving file to:', uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + path.extname(file.originalname);
        console.log('Saving file as:', filename);
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 } // Limit file size to 2MB
});

const uploadsPath = path.join(__dirname, 'uploads');
// Serve uploaded files
app.use('/uploads', express.static(uploadsPath));

// functions to read and write users.json
const usersFilePath = path.join(__dirname, 'users.json');

function readUsersFromFile() {
    try {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code !== 'ENOENT') console.error('Error reading user data:', err.message);
        return [];
    }
}

function writeUsersToFile(users) {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing users.json:', err);
    }
}

// Load users from JSON file on startup
let users = readUsersFromFile();

// Helper functions to read and write posts.json
const postsFilePath = path.join(__dirname, 'posts.json');

function readPostsFromFile() {
    try {
        const data = fs.readFileSync(postsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code !== 'ENOENT') console.error('Error reading post data:', err.message);
        return [];
    }
}

function writePostsToFile(posts) {
    try {
        fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing posts.json:', err);
    }
}

// Load posts from JSON file on startup
let posts = readPostsFromFile();

// Initialize postIdCounter to max existing post id + 1 or 1 if no posts
let postIdCounter = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;

// Middleware to simulate authentication (for demo purposes)
// Expects userId in header 'x-user-id'
app.use((req, res, next) => {
    const userId = parseInt(req.header('x-user-id'));
    if (userId) {
        const user = users.find(u => u.id === userId);
        if (user) {
            req.user = user;
        }
    }
    next();
});

// Get all posts
app.get('/api/posts', (req, res) => {
    res.json(posts);
});

// Create a new post
app.post('/api/posts', upload.array('images', 5), (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const newPost = {
        id: postIdCounter++,
        userId: req.user.id,
        userName: req.user.name,
        title,
        content,
        images,
        timestamp: new Date().toISOString()
    };
    posts.unshift(newPost);

    // Save posts to JSON file
    writePostsToFile(posts);

    res.status(201).json(newPost);
});

// Delete a post
app.delete('/api/posts/:id', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const postId = parseInt(req.params.id);
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
        return res.status(404).json({ error: 'Post not found' });
    }
    const post = posts[postIndex];
    if (req.user.role !== 'admin' && req.user.id !== post.userId) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own posts' });
    }
    posts.splice(postIndex, 1);

    // Save posts to JSON file
    writePostsToFile(posts);

    res.json({ message: 'Post deleted successfully' });
});

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.includes('@') || typeof password !== 'string' || password.length < 8) {
          return res.status(400).json({error:'Valid name, email and 8+ character password required'});
        }
        
        // Check if user already exists
        if (users.some(u => u.email === email)) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = {
            id: users.length + 1,
            name,
            email,
            password: hashedPassword,
            profile_picture: null
        };
        users.push(newUser);

        // Save users to JSON file
        writeUsersToFile(users);

        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/profile/membership', (req, res) => {
    try {
        const userId = parseInt(req.body.userId);
        const user = users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!user.membership) {
            return res.status(404).json({ error: 'No membership found' });
        }
        res.json({ membership: user.membership });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get membership' });
    }
});

app.post('/api/profile/membership/cancel', (req, res) => {
    try {
        const userId = parseInt(req.body.userId);
        const user = users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!user.membership || !user.membership.active) {
            return res.status(400).json({ error: 'No active membership to cancel' });
        }
        user.membership.active = false;
        writeUsersToFile(users);
        res.json({ message: 'Membership cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to cancel membership' });
    }
});

// User login endpoint (changed to all methods for debugging)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            console.log('Email or password missing in request body');
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = users.find(u => u.email === email);
        
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user data (without password)
        const { password: _, ...userData } = user;
        res.json({ 
            message: 'Login successful',
            user: userData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    // Here you can handle session termination if needed
    res.json({ message: 'Logout successful' });
});

// Profile picture upload endpoint

app.post('/api/profile/picture', upload.single('profile_picture'), (req, res) => {
    try {
        const userId = parseInt(req.body.userId);
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Delete old profile picture if exists
        if (user.profile_picture) {
            const oldFilePath = path.join(__dirname, user.profile_picture.replace(/^\//, ''));
            console.log('Old profile picture path:', oldFilePath);
            if (fs.existsSync(oldFilePath)) {
                try {
                    fs.unlinkSync(oldFilePath);
                    console.log('Deleted old profile picture:', oldFilePath);
                } catch (err) {
                    console.error('Error deleting old profile picture:', err);
                }
            } else {
                console.log('Old profile picture file does not exist:', oldFilePath);
            }
        }
        console.log('Uploaded file path:', req.file.path);

        // Update user's profile picture
        user.profile_picture = `/uploads/${req.file.filename}`;
        
        writeUsersToFile(users);
        res.json({ 
            message: 'Profile picture updated successfully',
            profile_picture: user.profile_picture
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware for multer errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(500).json({ error: 'File upload error' });
    } else if (err) {
        console.error('Unknown error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
    next();
});

// Password change endpoint
app.post('/api/profile/password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        const user = users.find(u => u.id === parseInt(userId));
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        writeUsersToFile(users);
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fallback route for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Home.HTML'));
});

// Handle OPTIONS preflight for /api/login
app.options('/api/login', (req, res) => {
    res.sendStatus(200);
});

// Catch-all middleware to log all requests
app.use((req, res, next) => {
    console.log(`Catch-all middleware: ${req.method} ${req.url}`);
    next();
});

// Debug catch-all POST route
app.post('*', (req, res) => {
    console.log(`Catch-all POST route hit: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'No matching POST route found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on port ${PORT}`);
});
