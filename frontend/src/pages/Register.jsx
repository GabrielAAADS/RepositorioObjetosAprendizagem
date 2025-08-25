import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import styles from '../components/Register.module.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.errors
        ? err.response.data.errors[0].msg
        : err.response?.data?.error || 'E-mail informado já está em uso.';
      setError(msg);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        <img src="/logo.svg" alt="Logo" className={styles.logo} />
      </div>

      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Crie uma conta</h2>
          <p className={styles.subtitle}>
            Digite seus dados para criar uma conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.inputGroup}>
            <label className={styles.label} for="name">
              Nome
            </label>
            <input
              name="name"
              id="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} for="email">
              Email
            </label>
            <input
              name="email"
              id="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} for="password">
              Senha
            </label>
            <input
              name="password"
              id="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.button}>
            Criar conta
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Já possui uma conta?{' '}
            <Link to="/login" className={styles.link}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
