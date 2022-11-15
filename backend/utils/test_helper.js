const User = require('../models/user')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, current) => {
    return sum + current.likes
  }
  return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  let favorite = null
  for(let i of blogs) {
    if(favorite === null) {
      favorite = i
    } else if (favorite.likes < i.likes) {
      favorite = i
    }
  }

  return { title: favorite.title, author: favorite.author, likes: favorite.likes, }
}

function reducerFunc ({ sums,most }, { likes, author })  {
  sums[author] = likes = (sums[author] || 0) + likes
  if (likes > most.likes) most = { author,likes }
  return { sums,most }
}

const mostLikes = (blogs) => blogs
  .reduce(reducerFunc, { sums: {}, most: { likes:0 } })
  .most

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}



module.exports = {
  dummy, totalLikes, favoriteBlog, mostLikes, usersInDb,
}