import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LockedView } from "./views/LockedView";
import { UnlockedView } from "./views/UnlockedView";

function App() {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const timerRef = useRef<number | null>(null);

  const lockVault = useCallback(async () => {
    try {
      await invoke('lock_vault');
      setIsLocked(true);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    } catch (e) {
      console.error("Error locking from timer:", e);
    }
  }, []);

  const resetTimeout = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    
    // Solo poner el timer si NO está bloqueado
    if (!isLocked) {
      timerRef.current = window.setTimeout(lockVault, 5 * 60 * 1000);
    }
  }, [isLocked, lockVault]);

  useEffect(() => {
    checkLockStatus();
  }, []);

  useEffect(() => {
    if (!isLocked) {
      resetTimeout();
      const events = ['mousemove', 'keydown', 'click', 'scroll'];
      const handleActivity = () => resetTimeout();
      
      events.forEach(e => window.addEventListener(e, handleActivity));
      
      return () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        events.forEach(e => window.removeEventListener(e, handleActivity));
      };
    } else {
      // Si se bloquea, limpiar cualquier timer pendiente
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isLocked, resetTimeout]);

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

  const handleManualLock = async () => {
    await lockVault();
  };

  if (isChecking) {
    return <div className="locked-container">Iniciando...</div>;
  }

  return (
    <>
      {isLocked ? (
        <LockedView onUnlock={() => {
          setIsLocked(false);
          // Al desbloquear, reiniciamos el timer inmediatamente
          resetTimeout();
        }} />
      ) : (
        <UnlockedView onLock={handleManualLock} />
      )}
    </>
  );
}

export default App;
