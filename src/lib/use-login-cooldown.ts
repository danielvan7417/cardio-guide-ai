import { useCallback, useEffect, useRef, useState } from "react";
import { emptyAttempts, failedLogin, LOGIN_LOCK_KEY, normalizeAttempts, remainingLockSeconds, type LoginAttempts } from "./access-security";

export function useLoginCooldown() {
  const fallback = useRef<LoginAttempts>({ ...emptyAttempts });
  const [attempts, setAttempts] = useState<LoginAttempts>({ ...emptyAttempts });
  const [seconds, setSeconds] = useState(0);
  const [ready, setReady] = useState(false);

  const read = useCallback(() => {
    try {
      return normalizeAttempts(JSON.parse(localStorage.getItem(LOGIN_LOCK_KEY) || "null"), Date.now());
    } catch {
      return normalizeAttempts(fallback.current, Date.now());
    }
  }, []);

  const write = useCallback((state: LoginAttempts) => {
    fallback.current = state;
    try { localStorage.setItem(LOGIN_LOCK_KEY, JSON.stringify(state)); } catch { /* Keep an in-memory fallback when storage is unavailable. */ }
    setAttempts(state);
    setSeconds(remainingLockSeconds(state, Date.now()));
  }, []);

  useEffect(() => {
    const sync = () => {
      const state = read();
      fallback.current = state;
      setAttempts(state);
      setSeconds(remainingLockSeconds(state, Date.now()));
      setReady(true);
    };
    sync();
    const interval = window.setInterval(sync, 250);
    const onStorage = (event: StorageEvent) => { if (event.key === LOGIN_LOCK_KEY || event.key === null) sync(); };
    window.addEventListener("storage", onStorage);
    return () => { window.clearInterval(interval); window.removeEventListener("storage", onStorage); };
  }, [read]);

  return {
    attempts, seconds, ready,
    check: () => remainingLockSeconds(read(), Date.now()),
    fail: () => write(failedLogin(read(), Date.now())),
    reset: () => write({ ...emptyAttempts }),
  };
}