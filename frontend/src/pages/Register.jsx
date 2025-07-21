import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await api.post('/auth/register', form)
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.errors
        ? err.response.data.errors[0].msg
        : err.response?.data?.error || 'Falha no registro'
      setError(msg)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-semibold mb-4">Registrar</h2>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <input
          name="name"
          type="text"
          placeholder="Nome"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full p-2 mb-4 border rounded"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full p-2 mb-4 border rounded"
        />

        <input
          name="password"
          type="password"
          placeholder="Senha (mínimo 6 caracteres)"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full p-2 mb-4 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded"
        >
          Cadastrar
        </button>

        <p className="mt-4 text-center">
          Já tem conta?{' '}
          <Link to="/login" className="text-blue-500 hover:underline">
            Faça login
          </Link>
        </p>
      </form>
    </div>
  )
}
