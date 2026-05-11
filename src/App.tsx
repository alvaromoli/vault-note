import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LockedView } from "./views/LockedView";
import { UnlockedView } from "./views/UnlockedView";

function App() {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  useEffect(() => {
    checkLockStatus();
  }, []);

  const resetTimeout = () => {
    if (timeoutId) window.clearTimeout(timeoutId);
    // Bloquear después de 5 minutos de inactividad
    const id = window.setTimeout(async () => {
      try {
        await invoke('lock_vault');
        setIsLocked(true);
      } catch (e) {
        console.error(e);
      }
    }, 5 * 60 * 1000);
    setTimeoutId(id);
  };

  useEffect(() => {
    if (!isLocked) {
      resetTimeout();
      const events = ['mousemove', 'keydown', 'click', 'scroll'];
      const handleActivity = () => resetTimeout();
      
      events.forEach(e => window.addEventListener(e, handleActivity));
      
      return () => {
        if (timeoutId) window.clearTimeout(timeoutId);
        events.forEach(e => window.removeEventListener(e, handleActivity));
      };
    }
  }, [isLocked]);

  const checkLockStatus = async () => {
    try {
      const locked = await invoke<boolean>("is_locked");
      setIsLocked(locked);
    } catch (e) {
      console.error("Error checking lock status", e);
      setIsLocked(true);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return <div className="locked-container">Iniciando...</div>;
  }

  return (
    <>
      {isLocked ? (
        <LockedView onUnlock={() => setIsLocked(false)} />
      ) : (
        <UnlockedView onLock={() => setIsLocked(true)} />
      )}
    </>
  );
}

export default App;
