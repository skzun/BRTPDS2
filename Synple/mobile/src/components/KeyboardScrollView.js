import { createContext, useEffect, useRef } from 'react';
import { Dimensions, Keyboard, Platform, ScrollView } from 'react-native';

export const FieldScrollContext = createContext(() => {});

export function KeyboardScrollView({ children, onScroll, ...props }) {
  const scroll = useRef(null), focused = useRef(null), offset = useRef(0), keyboardTop = useRef(Infinity), timer = useRef(null);
  function reveal() {
    if (Platform.OS === 'web' || !focused.current) return;
    focused.current.measureInWindow?.((x, y, width, height) => {
      const visibleBottom = Math.min(keyboardTop.current, Dimensions.get('window').height);
      if (y + height + 24 > visibleBottom) scroll.current?.scrollTo({ y: Math.max(0, offset.current + y + height + 24 - visibleBottom), animated: true });
    });
  }
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', event => { keyboardTop.current = event.endCoordinates.screenY; clearTimeout(timer.current); timer.current=setTimeout(reveal,100); });
    const hide = Keyboard.addListener('keyboardDidHide', () => { keyboardTop.current=Infinity; });
    return () => { show.remove(); hide.remove(); clearTimeout(timer.current); };
  }, []);
  function focus(input) { focused.current=input; clearTimeout(timer.current); timer.current=setTimeout(reveal,300); }
  return <FieldScrollContext.Provider value={focus}><ScrollView {...props} ref={scroll} scrollEventThrottle={16} onScroll={event=>{offset.current=event.nativeEvent.contentOffset.y;onScroll?.(event);}}>{children}</ScrollView></FieldScrollContext.Provider>;
}
