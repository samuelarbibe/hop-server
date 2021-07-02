const login = (agent) => agent
  .post('/api/users/login')
  .send({ username: 'username', password: 'password' })

const logout = (agent) => agent
  .post('/api/users/logout')

module.exports = {
  login,
  logout
}