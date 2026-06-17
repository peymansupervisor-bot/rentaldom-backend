import express from 'express';

const app = express();

app.get('/debug', async (_req, res) => {
  const results: Record<string, string> = {};
  const mods = [
    ['cors', () => require('cors')],
    ['helmet', () => require('helmet')],
    ['dotenv', () => require('dotenv/config')],
    ['supabase-js', () => require('@supabase/supabase-js')],
    ['jsonwebtoken', () => require('jsonwebtoken')],
    ['multer', () => require('multer')],
    ['resend', () => require('resend')],
    ['anthropic', () => require('@anthropic-ai/sdk')],
    ['firebase-admin', () => require('firebase-admin/app')],
    ['sharp', () => require('sharp')],
  ];

  for (const [name, loader] of mods) {
    try {
      loader();
      results[name] = 'ok';
    } catch (e: any) {
      results[name] = e.code ?? e.message?.slice(0, 100);
    }
  }

  res.json(results);
});

export default app;
