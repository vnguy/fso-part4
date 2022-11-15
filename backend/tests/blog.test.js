/* eslint-disable no-undef */
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const api = supertest(app)

jest.setTimeout(15000)

const blogs = [
  {
    _id: '5a422a851b54a676234d17f7',
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
    __v: 0
  },
  {
    _id: '5a422aa71b54a676234d17f8',
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
    __v: 0
  },
  {
    _id: '5a422b3a1b54a676234d17f9',
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
    __v: 0
  },
  {
    _id: '5a422b891b54a676234d17fa',
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
    likes: 10,
    __v: 0
  },
  {
    _id: '5a422ba71b54a676234d17fb',
    title: 'TDD harms architecture',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html',
    likes: 0,
    __v: 0
  },
  {
    _id: '5a422bc61b54a676234d17fc',
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 2,
    __v: 0
  }
]

let token = ''
let userForToken = {}
beforeEach(async () => {
  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ username: 'root', passwordHash })

  await User.deleteMany({})

  await user.save()

  const found = await User.find({ username : 'root' })

  const loginUser = { username: 'root', password: 'sekret' }

  userForToken = {
    username: found[0].username,
    id: found[0].id,
  }

  token = jwt.sign(userForToken, process.env.SECRET)

  await Blog.deleteMany({})
  let blogObjects = blogs.map(b => new Blog(b))
  for(let blogObj of blogObjects) {
    blogObj.user = userForToken.id
    await blogObj.save()
  }
})

describe('api test', () => {

  test('get to /api/blogs return blogs in JSON', async () => {
    const result = await api.get('/api/blogs').expect(200).expect('Content-Type', /application\/json/)
    const contents = result.body.map(r => r.id)
    expect(result.body).toHaveLength(6)

  })

  test('/api/blogs verify unique id property', async () => {

    const response = await api.get('/api/blogs').expect(200).expect('Content-Type', /application\/json/)
    for(i of response.body) {
      expect(i.id).toBeDefined()
    }

  })

  test('blog verify HTTP Post request', async () => {
    const newBlog = {
      id: '6a422b891b54a676234d17fa',
      title: 'First class tests 2',
      author: 'Robert C. Martin Test',
      url: 'http://blog.cleancoder2.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
      likes: 100,
      __v: 0 }

    const response = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)


    const result = await api.get('/api/blogs')

    const blogList = await Blog.find({ id:'6a422b891b54a676234d17fa' })

    expect(result.body).toHaveLength(7)

  })

  test('Post request with no token -> 401', async () => {
    const newBlog = {
      id: '6a422b891b54a676234d17fa',
      title: 'First class tests 2',
      author: 'Robert C. Martin Test',
      url: 'http://blog.cleancoder2.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
      likes: 100,
      __v: 0 }

    const response = await api
      .post('/api/blogs')
      .send(newBlog)

    expect(response.status).toBe(401)

  })


  test('verify if the likes poperty is missing, deafult value 0', async () => {
    await Blog.deleteMany({})
    const newBlog =     {
      _id: '5a422b3a1b54a676234d17f9',
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
      __v: 0
    }

    await api.post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)

    const response = await api.get('/api/blogs')

    expect(response.body[0].likes).toBe(0)
  })

  test('functionality for deleting a single post', async () => {
    const Oldblogs = await api.get('/api/blogs')
    await api.delete('/api/blogs/5a422ba71b54a676234d17fb')
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    const newBlogs = await api.get('/api/blogs')

    expect(newBlogs.body.length).toEqual(Oldblogs.body.length-1)


  },40000)

  test('updating blog post', async () => {
    await api.put('/api/blogs/5a422a851b54a676234d17f7')
      .set('Authorization', `Bearer ${token}`)
      .send({ likes: 1000 })

    const result = await api.get('/api/blogs/5a422a851b54a676234d17f7')
    expect(result.body).toEqual({
      id: '5a422a851b54a676234d17f7',
      title: 'React patterns',
      author: 'Michael Chan',
      url: 'https://reactpatterns.com/',
      likes: 1000,
      user: `${userForToken.id}` })
  })

})



test('post to /api/blogs verify url properties', async () => {
  const newBlog = {
    id: '6a422b891b54a676234d17fb',
    author: 'Robert C. Martin Test',
    title: 'React patternsadasd',
    likes: 100,
    __v: 0 }

  const result = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)

  expect(result.status).toEqual(400)

})

test('post to /api/blogs verify title properties', async () => {
  const newBlog = {
    id: '6a422b891b54a676234d17fb',
    author: 'Robert C. Martin Test',
    url: 'http://www.test.com',
    likes: 100,
    __v: 0 }

  const result = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)

  expect(result.status).toEqual(400)

})

afterAll(() => {
  mongoose.connection.close()
})