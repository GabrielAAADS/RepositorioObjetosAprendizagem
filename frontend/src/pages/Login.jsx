import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import styles from '../components/Login.module.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'E-mail ou senha incorretos. Tente novamente');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        <img src="/logo.svg" alt="Logo" className={styles.logo} />
      </div>

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <h3 className={styles.title}>Acesse sua conta</h3>
        <p className={styles.subtitle}>Digite seus dados para continuar</p>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Senha</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.button}>
          Entrar
        </button>

        <p className={styles.footer}>
          Ainda não tem conta?{' '}
          <a href="/register" className={styles.link}>
            Criar conta
          </a>
        </p>
      </form>
    </div>
  );
}
