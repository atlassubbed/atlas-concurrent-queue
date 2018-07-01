const asyncCall = cb => {
  setTimeout(() => {
    cb()
  }, 10)
}

module.exports = { asyncCall }
