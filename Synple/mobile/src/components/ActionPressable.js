import { useEffect, useRef, useState } from 'react';
import { Pressable as NativePressable } from 'react-native';

// Trava toques repetidos por um curto intervalo para evitar comandos duplicados.
export function Pressable({ onPress, disabled, ...props }) {
  const [locked, setLocked] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handlePress(event) {
    if (locked || disabled) return;
    setLocked(true);
    timer.current = setTimeout(() => setLocked(false), 750);
    onPress?.(event);
  }

  return <NativePressable hitSlop={props.hitSlop ?? 6} {...props} disabled={disabled || locked} onPress={handlePress} />;
}
