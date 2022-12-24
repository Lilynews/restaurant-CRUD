//////// setting variable, file, 3rd-party-tool
const express = require('express') //install express
const app = express()
const port = 3000
const mongoose = require('mongoose')// install mongoose
const exphbs = require('express-handlebars')
const RestaurantList = require('./models/restaurants') // install restaurant model
const bodyParser = require('body-parser') // install body-parser



//////// setting for DB connection 
// only for non-production environment
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
// connect to mongoDB
mongoose.connect(process.env.MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true })

// DB connected status
const db = mongoose.connection
db.on('error', () => {
  console.log('mongodb error!')
})
db.once('open', () => {
  console.log('mongodb connected!')
})

//////// setting express-handlebars
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  helpers: {
    selected: (sortSelected) => {
      if (sortSelected) return "selected"
    }
  }
}))
app.set('view engine', 'hbs')

// 用 app.use 規定每一筆請求都需要透過 body-parser 進行前置處理
app.use(bodyParser.urlencoded({ extended: true }))
/////// use public static files
app.use(express.static('public'))

// search & sort
app.get('/', (req, res) => {
  const keyword = (req.query.keyword) ? req.query.keyword.trim() : ''
  const sort = req.query.sort || 'default'
  const sortBy = {
    default: { _id: 'asc' },
    AtoZ: { name: 'asc' },
    ZtoA: { name: 'desc' },
    category: { category: 'asc' },
    location: { location: 'asc' }
  }
  const sortSelected = { [sort]: true }

  RestaurantList.find()
    .lean()
    .sort(sortBy[sort])
    .then(restaurants => {
      const searchResult = restaurants.filter(restaurant => restaurant.name.toLowerCase().includes(keyword.toLowerCase()) || restaurant.category.includes(keyword))

      if (!keyword) {
        res.render('index', { restaurants, sortSelected })
      } else {
        res.render('index', { restaurants: searchResult, keyword, sortSelected })
      }
    })
    .catch(error => console.log(error))
})

// new page
app.get('/restaurants/new', (req, res) => {
  res.render('new')
})

app.post('/restaurants', (req, res) => {
  return RestaurantList.create(req.body)
    .then(() => res.redirect('/'))
    .catch(error => console.log(error))
})
// edit page
app.get('/restaurants/:restaurant_id/edit', (req, res) => {
  const id = req.params.restaurant_id
  RestaurantList.findById(id)
    .lean()
    .then(restaurant => res.render('edit', { restaurant }))
    .catch(error => console.log(error))
})

app.post('/restaurants/:restaurant_id/edit', (req, res) => {
  const id = req.params.restaurant_id
  return RestaurantList.findByIdAndUpdate(id, req.body)
    .then(() => res.redirect('/'))
    .catch(error => console.log(error))
})

// delete page
app.post('/restaurants/:id/delete', (req, res) => {
  const id = req.params.id
  return RestaurantList.findById(id)
    .then(restaurant => restaurant.remove())
    .then(() => res.redirect('/'))
    .catch(error => console.log(error))
})

// show page
app.get('/restaurants/:restaurant_id', (req, res) => {
  const id = req.params.restaurant_id
  return RestaurantList.findById(id)
    .lean()
    .then(restaurant => {
      // console.log(restaurant._id)
      res.render('show', { restaurant })
    })
    .catch(error => console.log(error))
})


//////// setting listening
app.listen(port, () => {
  console.log(`Express is listening on localhost:${port}`)
})