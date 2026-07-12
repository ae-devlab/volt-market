// Translate common Supabase/auth errors into friendly Bulgarian messages.
const MAP = {
  'Invalid login credentials': 'Грешен имейл или парола.',
  'User already registered': 'Вече съществува профил с този имейл.',
  'Email not confirmed': 'Имейлът не е потвърден. Провери пощата си.',
  'Password should be at least 6 characters': 'Паролата трябва да е поне 6 символа.',
  'For security purposes': 'Твърде много опити. Опитай пак след малко.',
  'duplicate key value': 'Този запис вече съществува.',
  'new row violates row-level security': 'Нямаш права за това действие.',
}

export function friendlyError(err) {
  const msg = typeof err === 'string' ? err : err?.message || 'Възникна неочаквана грешка.'
  for (const key of Object.keys(MAP)) {
    if (msg.includes(key)) return MAP[key]
  }
  return msg
}
