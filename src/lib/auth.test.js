import { generateToken, verifyToken, getTokenFromRequest, AUTH_COOKIE_NAME } from './auth'

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

describe('getTokenFromRequest', () => {
  test('extracts token from cookie', () => {
    const mockRequest = {
      cookies: {
        get: jest.fn((name) => (name === AUTH_COOKIE_NAME ? { value: 'cookie-jwt-token' } : null))
      },
      headers: {
        get: jest.fn(() => null)
      }
    }

    const token = getTokenFromRequest(mockRequest)
    expect(token).toBe('cookie-jwt-token')
  })

  test('extracts token from Authorization header fallback when cookie is absent', () => {
    const mockRequest = {
      cookies: {
        get: jest.fn(() => null)
      },
      headers: {
        get: jest.fn((header) => (header === 'authorization' ? 'Bearer bearer-jwt-token' : null))
      }
    }

    const token = getTokenFromRequest(mockRequest)
    expect(token).toBe('bearer-jwt-token')
  })

  test('prioritizes httpOnly cookie when both cookie and header are present', () => {
    const mockRequest = {
      cookies: {
        get: jest.fn((name) => (name === AUTH_COOKIE_NAME ? { value: 'priority-cookie-token' } : null))
      },
      headers: {
        get: jest.fn((header) => (header === 'authorization' ? 'Bearer header-token' : null))
      }
    }

    const token = getTokenFromRequest(mockRequest)
    expect(token).toBe('priority-cookie-token')
  })

  test('returns null when neither cookie nor valid header is present', () => {
    const mockRequest = {
      cookies: {
        get: jest.fn(() => null)
      },
      headers: {
        get: jest.fn(() => null)
      }
    }

    expect(getTokenFromRequest(mockRequest)).toBeNull()
    expect(getTokenFromRequest(null)).toBeNull()
  })
})
