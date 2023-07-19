const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { marked } = require('marked');
const MongoStore = require('connect-mongodb-session')(session);
const sanitizeHtml = require('sanitize-html');
const { JSDOM } = require('jsdom');
const { window } = new JSDOM('');
const { document } = (new JSDOM('')).window;

global.document = document;


const dburl = require('./db');

const DOMPurify = require('dompurify')(window);
const app = express();
const PORT = 3000;

app.locals.marked = marked;

const store = new MongoStore({
  uri: dburl,
  collection: 'sessions'
});

// Connect to MongoDB
mongoose.connect(dburl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch(err => {
  console.error("Error connecting to MongoDB", err);
});

const genSecretKey = () => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, (num) => chars[num % chars.length]).join('');
}

app.use(
  session({
    secret: genSecretKey(),
    resave: true,
    saveUninitialized: true,
    store: store,
  })
);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('User ID:', req.session.userId);
  next();
});

const User = mongoose.model('User', new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
}));

const Note = mongoose.model('Note', new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}));

app.get('/', async (req, res) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      const notes = await Note.find({ user: user._id });

      // Render Markdown and sanitize HTML for each note
      const renderedNotes = notes.map(note => {
        const content = marked(note.content, {
          sanitize: true,
          sanitizer: DOMPurify.sanitize,
          renderer: createCustomRenderer()
        });
        return { ...note.toObject(), renderedContent: content };
      });

      res.render('home', { user, notes: renderedNotes });
    } else {
      res.render('home', { user: null, notes: [] });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

function createCustomRenderer() {
  const renderer = new marked.Renderer();

  renderer.image = (href, title, text) => {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return `<img src="${DOMPurify.sanitize(href)}" alt="${DOMPurify.sanitize(text)}"${title ? ` title="${DOMPurify.sanitize(title)}"` : ''}>`;
    }
    return `<img src="/images/${DOMPurify.sanitize(href)}" alt="${DOMPurify.sanitize(text)}"${title ? ` title="${DOMPurify.sanitize(title)}"` : ''}>`;
  };

  return renderer;
}

app.get('/notes/new', (req, res) => {
  res.render('components/new');
});

app.post('/notes', async (req, res) => {
  try{
    const {title, content} = req.body;
    const note = await Note.create({title, content, user: req.session.userId});
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/notes/edit/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).send('Note not found');
    }
    res.render('components/edit', { note });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/notes/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findByIdAndUpdate(req.params.id, { title, content, user: req.session.userId });
    if (!note) {
      return res.status(404).send('Note not found');
    }
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/notes/:id/delete', async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) {
      return res.status(404).send('Note not found');
    }
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/signup', (req, res) => {
  res.render('components/signup');
});

app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    req.session.userId = user._id;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/login', (req, res) => {
  res.render('components/login');
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).redirect('/', { error: 'Invalid email or password' });
    }

    req.session.userId = user._id;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/', (req, res) => {
  res.redirect('/');
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
