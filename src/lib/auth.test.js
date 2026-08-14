

import { generateToken, verifyToken } from './auth'

describe('generateToken / verifyToken', () => {
  const fakeUser = { id: '123', username: 'testuser', role: 'student', name: 'Test User' }

  test('a token generated for a user can be verified back to the same user', () => {
    const token = generateToken(fakeUser)
    const decoded = verifyToken(token)

    expect(decoded).not.toBeNull()
    expect(decoded.username).toBe('testuser')
    expect(decoded.role).toBe('student')
  })

  test('an invalid/garbage token fails verification instead of crashing the app', () => {
    const decoded = verifyToken('this-is-not-a-real-token')
    expect(decoded).toBeNull()
  })
})
