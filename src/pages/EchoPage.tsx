import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  List,
  Section,
  Placeholder,
} from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page.tsx';
import { getItem, setItem, isSupported } from '@/storage/cloudStorage.ts';

const ECHO_KEY = 'echo';

type Status = 'idle' | 'saving' | 'saved' | 'loading' | 'error';

export function EchoPage() {
  const [draft, setDraft] = useState('');
  const [stored, setStored] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  // Автозавантаження при монтуванні — доказ персистентності між сесіями:
  // зберіг → закрив Mini App → відкрив → значення з'явилось без "Прочитати".
  useEffect(() => {
    if (!isSupported()) {
      setStatus('error');
      setError('CloudStorage недоступний у цьому оточенні (потрібен Telegram).');
      return;
    }
    setStatus('loading');
    getItem(ECHO_KEY)
      .then((value) => {
        setStored(value);
        setStatus('idle');
      })
      .catch((e: unknown) => {
        setStatus('error');
        setError(e instanceof Error ? e.message : String(e));
      });
  }, []);

  async function handleSave() {
    setStatus('saving');
    setError('');
    try {
      await setItem(ECHO_KEY, draft);
      setStatus('saved');
    } catch (e: unknown) {
      setStatus('error');
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleRead() {
    setStatus('loading');
    setError('');
    try {
      const value = await getItem(ECHO_KEY);
      setStored(value);
      setStatus('idle');
    } catch (e: unknown) {
      setStatus('error');
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Page back={false}>
      <List>
        <Section
          header="Перевірка Telegram CloudStorage"
          footer="Зберегти → закрити Mini App → відкрити знову: значення має підвантажитись автоматично."
        >
          <Input
            header="Значення"
            placeholder="Введи будь-який текст"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
            <Button size="m" stretched onClick={() => { void handleSave(); }} loading={status === 'saving'}>
              Зберегти
            </Button>
            <Button size="m" mode="outline" stretched onClick={() => { void handleRead(); }} loading={status === 'loading'}>
              Прочитати
            </Button>
          </div>
        </Section>

        <Section header="Результат">
          <Placeholder
            header={
              status === 'error'
                ? 'Помилка'
                : stored === null
                  ? 'Ще не зчитано'
                  : stored === ''
                    ? 'Порожньо'
                    : 'Збережене значення'
            }
            description={
              status === 'error'
                ? error
                : stored
                  ? stored
                  : 'Натисни "Прочитати" або перезапусти Mini App'
            }
          />
        </Section>
      </List>
    </Page>
  );
}
