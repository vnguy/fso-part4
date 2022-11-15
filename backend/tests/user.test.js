/* eslint-disable no-undef */
const bcrypt = require('bcrypt')
const User = require('../models/user')
const helper = require('../utils/test_helper')
const supertest = require('supertest')
const app = require('../app')

const api = supertest(app)
//...



describe('when there is initially one user in db', () => {
  let token = ''
  beforeEach(async () => {
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()

  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('username must be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })

  test('creation fails when username is too short', async () => {
    const newUser = {
      username: 'he',
      name: 'fail',
      password: 'omg',
    }
    const result = await api.post('/api/users').send(newUser).expect(400).expect('Content-Type', /application\/json/)

    const notInDB = await User.find({ username: 'he' })

    expect(notInDB).toHaveLength(0)

    expect(result.body.error).toContain('username and password length must be 3 or more characters')
  })

  test('create and login with user', async () => {
    const newUser = {
      username: 'newroot',
      name: 'Superuser',
      password: 'salainen',
    }
    const result = await api.post('/api/users').send(newUser).expect(201).expect('Content-Type', /application\/json/)

    const userInfo = {
      username: 'newroot',
      password: 'salainen',
    }

    const loggedin = await api
      .post('/api/login')
      .set('Authorization', `Bearer ${token}`)
      .send(userInfo).expect(200)

  })

})