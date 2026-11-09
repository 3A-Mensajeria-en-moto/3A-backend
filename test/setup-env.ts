// Se ejecuta antes de cargar la app: base en memoria, sin mails reales.
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'secreto-de-test';
process.env.SEED_DEMO = 'true';
process.env.SMTP_HOST = '';
