import {
  useRef,
  useState,
  useEffect,
  useReducer,
  useCallback,
} from 'react';

// https://gist.github.com/mudge/eb9178a4b6d595ffde8f9cb31744afcf
const useDebounce = (callback: () => any, delay: number): () => any => {
  const latestCallback = useRef<Function>();
  const [callCount, setCallCount] = useState<number>(0);

  useEffect((): void => {
    latestCallback.current = callback;
  }, [callback]);

  useEffect((): any => {
    if (callCount > 0) {
      const fire = (): void => {
        setCallCount(0);
        if (latestCallback.current) {
          latestCallback.current();
        }
      };

      const id = setTimeout(fire, delay);
      return (): void => clearTimeout(id);
    }
  }, [callCount, delay]);

  return (): void => setCallCount((cc: number): number => cc + 1);
};

// Adapted from
// https://github.com/arthurtyukayev/use-keyboard-shortcut/blob/master/useKeyboardShortcut.js
const blacklistedTargets = ['INPUT'];

const ACTION_SET_KEY_UP = 'ACTION_SET_KEY_UP';
const ACTION_SET_KEY_DOWN = 'ACTION_SET_KEY_DOWN';

type KeysActionType =
  | 'ACTION_SET_KEY_UP'
  | 'ACTION_SET_KEY_DOWN';

interface KeysAction {
  type: KeysActionType;
  key: string;
}

interface KeysReducerState {
  [key: string]: boolean;
}

const keysReducer = (state: KeysReducerState, action: KeysAction): KeysReducerState => {
  switch (action.type) {
    case ACTION_SET_KEY_DOWN:
      return { ...state, [action.key]: true };
    case ACTION_SET_KEY_UP:
      return { ...state, [action.key]: false };
    default:
      return state;
  }
};

const useKeyboardShortcut = (shortcutKeys: string[], callback: (key: KeysReducerState) => void): void => {
  if (!Array.isArray(shortcutKeys)) {
    throw new Error(
      'The first parameter to `useKeyboardShortcut` must be an ordered array of `KeyboardEvent.key` strings.',
    );
  }

  if (!shortcutKeys.length) {
    throw new Error(
      'The first parameter to `useKeyboardShortcut` must contain at least one `KeyboardEvent.key` string.',
    );
  }

  if (!callback || typeof callback !== 'function') {
    throw new Error(
      'The second parameter to `useKeyboardShortcut` must be a function that will be invoked when the keys are pressed.',
    );
  }

  const initalKeyMapping: KeysReducerState = shortcutKeys.reduce((currentKeys: {[key: string]: boolean}, key): {[key: string]: boolean} => {
    currentKeys[key.toLowerCase()] = false;
    return currentKeys;
  }, {});

  const [keys, setKeys] = useReducer(keysReducer, initalKeyMapping);

  const keydownListener = useCallback((keydownEvent: KeyboardEvent): void => {
    const { key, target, repeat } = keydownEvent;
    const loweredKey = key.toLowerCase();

    if (
      repeat
      || blacklistedTargets.includes((target as HTMLInputElement).tagName)
      || keys[loweredKey] === undefined
    ) {
      return;
    }

    if (keys[loweredKey] === false) {
      setKeys({ type: ACTION_SET_KEY_DOWN, key: loweredKey });
    }
  }, [keys]);

  const keyupListener = useCallback((keyupEvent: KeyboardEvent): void => {
    const { key, target } = keyupEvent;
    const loweredKey = key.toLowerCase();

    if (
      blacklistedTargets.includes((target as HTMLInputElement).tagName)
      || keys[loweredKey] === undefined
    ) {
      return;
    }

    if (keys[loweredKey] === true) {
      setKeys({ type: ACTION_SET_KEY_UP, key: loweredKey });
    }
  }, [keys]);

  useEffect((): void => {
    if (!Object.values(keys).filter((value): boolean => !value).length) {
      callback(keys);
    }
  }, [callback, keys]);

  useEffect((): (() => any) => {
    window.addEventListener('keydown', keydownListener, true);
    return () => window.removeEventListener('keydown', keydownListener, true);
  }, [keydownListener]);

  useEffect((): (() => any) => {
    window.addEventListener('keyup', keyupListener, true);
    return () => window.removeEventListener('keyup', keyupListener, true);
  }, [keyupListener]);
};

export {
  useKeyboardShortcut,
  useDebounce,
};
