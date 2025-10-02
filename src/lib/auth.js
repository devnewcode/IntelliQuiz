import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import dbConnect from './mongodb'
import User from './models/User'

const JWT_SECRET = process.env.JWT_SECRET

export async function authenticateUser(username, password) {
  try {
    await dbConnect()
    
    const user = await User.findOne({ 
      username: username.toLowerCase(),
      isActive: true 
    })
    
    if (!user) {
      return null
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return null
    }

    return {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export async function createUser(userData) {
  try {
    await dbConnect()
    
    const existingUser = await User.findOne({
      $or: [
        { username: userData.username.toLowerCase() },
        { email: userData.email.toLowerCase() }
      ]
    })
    
    if (existingUser) {
      if (existingUser.username === userData.username.toLowerCase()) {
        throw new Error('Username already exists')
      }
      if (existingUser.email === userData.email.toLowerCase()) {
        throw new Error('Email already exists')
      }
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    const user = await User.create({
      username: userData.username.toLowerCase(),
      password: hashedPassword,
      name: userData.name,
      email: userData.email.toLowerCase(),
      role: userData.role || 'student'
    })

    return {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    }
  } catch (error) {
    throw error
  }
}

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}