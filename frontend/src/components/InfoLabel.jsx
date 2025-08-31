import React from 'react';
import styles from './InfoLabel.module.css';

export default function InfoLabel({ label, info, htmlFor }) {
  return (
    <div className={styles.wrap}>
      <label htmlFor={htmlFor} className={styles.label}>{label}</label>
      {info && (
        <button
          type="button"
          className={styles.badge}
          title={info}
          aria-label={info}
        >
          i
        </button>
      )}
    </div>
  );
}
