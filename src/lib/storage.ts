import { Form, Response } from './types';

const useKV = !!process.env.KV_REST_API_URL;

// ── KV helpers (production) ──────────────────────────────────────────────────

async function kvGetForm(id: string): Promise<Form | undefined> {
  const { kv } = await import('@vercel/kv');
  const form = await kv.get<Form>(`form:${id}`);
  return form ?? undefined;
}

async function kvSaveForm(form: Form): Promise<void> {
  const { kv } = await import('@vercel/kv');
  await kv.set(`form:${form.id}`, form);
  if (form.creatorId) {
    await kv.sadd(`user_forms:${form.creatorId}`, form.id);
  }
}

async function kvGetFormsByUser(creatorId: string): Promise<Form[]> {
  const { kv } = await import('@vercel/kv');
  const ids = await kv.smembers(`user_forms:${creatorId}`);
  if (!ids.length) return [];
  const forms = await Promise.all(ids.map(id => kv.get<Form>(`form:${id}`)));
  return forms.filter(Boolean) as Form[];
}

async function kvGetResponses(formId: string): Promise<Response[]> {
  const { kv } = await import('@vercel/kv');
  return (await kv.get<Response[]>(`responses:${formId}`)) ?? [];
}

async function kvSaveResponse(response: Response): Promise<void> {
  const { kv } = await import('@vercel/kv');
  const existing = await kvGetResponses(response.formId);
  const updated = [...existing.filter(r => r.id !== response.id), response];
  await kv.set(`responses:${response.formId}`, updated);
}

// ── File helpers (local dev) ─────────────────────────────────────────────────

function fileStorage() {
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');
  const DATA_DIR = path.join(process.cwd(), 'data');
  const FORMS_FILE = path.join(DATA_DIR, 'forms.json');
  const RESPONSES_FILE = path.join(DATA_DIR, 'responses.json');

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FORMS_FILE)) fs.writeFileSync(FORMS_FILE, '[]');
  if (!fs.existsSync(RESPONSES_FILE)) fs.writeFileSync(RESPONSES_FILE, '[]');

  return { fs, FORMS_FILE, RESPONSES_FILE };
}

function fileGetForm(id: string): Form | undefined {
  const { fs, FORMS_FILE } = fileStorage();
  const forms: Form[] = JSON.parse(fs.readFileSync(FORMS_FILE, 'utf-8'));
  return forms.find(f => f.id === id);
}

function fileSaveForm(form: Form): void {
  const { fs, FORMS_FILE } = fileStorage();
  const forms: Form[] = JSON.parse(fs.readFileSync(FORMS_FILE, 'utf-8'));
  const updated = [...forms.filter(f => f.id !== form.id), form];
  fs.writeFileSync(FORMS_FILE, JSON.stringify(updated, null, 2));
}

function fileGetFormsByUser(creatorId: string): Form[] {
  const { fs, FORMS_FILE } = fileStorage();
  const forms: Form[] = JSON.parse(fs.readFileSync(FORMS_FILE, 'utf-8'));
  return forms.filter(f => f.creatorId === creatorId);
}

function fileGetResponses(formId: string): Response[] {
  const { fs, RESPONSES_FILE } = fileStorage();
  const all: Response[] = JSON.parse(fs.readFileSync(RESPONSES_FILE, 'utf-8'));
  return all.filter(r => r.formId === formId);
}

function fileSaveResponse(response: Response): void {
  const { fs, RESPONSES_FILE } = fileStorage();
  const all: Response[] = JSON.parse(fs.readFileSync(RESPONSES_FILE, 'utf-8'));
  const updated = [...all.filter(r => r.id !== response.id), response];
  fs.writeFileSync(RESPONSES_FILE, JSON.stringify(updated, null, 2));
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getForm(id: string): Promise<Form | undefined> {
  return useKV ? kvGetForm(id) : fileGetForm(id);
}

export async function saveForm(form: Form): Promise<void> {
  return useKV ? kvSaveForm(form) : fileSaveForm(form);
}

export async function getResponses(formId: string): Promise<Response[]> {
  return useKV ? kvGetResponses(formId) : fileGetResponses(formId);
}

export async function saveResponse(response: Response): Promise<void> {
  return useKV ? kvSaveResponse(response) : fileSaveResponse(response);
}

export async function getFormsByUser(creatorId: string): Promise<Form[]> {
  return useKV ? kvGetFormsByUser(creatorId) : fileGetFormsByUser(creatorId);
}
