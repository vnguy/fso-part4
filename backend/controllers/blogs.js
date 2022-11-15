const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', (request, response, next) => {
  Blog.find({}).populate('user', { username: 1, name: 1, id: 1 })
    .then(blog => {
      response.json(blog)
    })
    .catch(error => {
      next(error)
    })
})

blogsRouter.get('/:id', (request, response, next) => {
  Blog.findById(request.params.id)
    .then(blog => {
      response.json(blog)
    })
    .catch(error => {
      next(error)
    })
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body

  if(!request.token) {
    return response.status(401).json({
      error: 'token missing or invalid'
    })
  }

  const user = request.user

  //const decodedToken = jwt.verify(request.token, process.env.SECRET)
  if(!user) {
    return response.status(401).json({
      error: 'token missing or invalid'
    })
  }

  if(!('title' in body) ||  !('url' in body)) {
    return response.status(400).json({
      error: 'title or url missing'
    })
  }
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id
  })

  const savedBlog = await blog.save()

  user.blogs = user.blogs.concat(savedBlog._id)

  await user.save()
  response.json(savedBlog)

})

blogsRouter.delete('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  const user = request.user
  if(user.id.toString() !== blog.user.toString()) {
    return response.status(401).json({
      error: 'token missing or invalid'
    })
  }

  await Blog.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {

  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  }

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
  response.json(updatedBlog)

})

module.exports = blogsRouter