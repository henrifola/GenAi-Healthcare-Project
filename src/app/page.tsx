import styles from '../styles/page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.heading}>🩺 HaruCare</h1>
        <p className={styles.description}>
          HaruCare is an AI-powered healthcare companion system designed to
          analyze smart watch data (like Fitbit) and provide users with
          personalized daily insights and recommendations using Generative AI.
        </p>
        <p className={styles.description}>
          The goal is to make health data <strong>understandable</strong>,{' '}
          <strong>actionable</strong>, and
          <strong> motivational</strong> — all in natural language.
        </p>
      </main>
    </div>
  );
}
