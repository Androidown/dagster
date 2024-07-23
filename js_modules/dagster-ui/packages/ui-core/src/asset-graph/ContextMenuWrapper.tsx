import {Colors} from '@dagster-io/ui-components';
import * as React from 'react';
import ReactDOM from 'react-dom';

const CONTEXT_MENU_EVENT = 'context-menu-event';

export const ContextMenuWrapper = ({
  children,
  menu,
  stopPropagation,
  wrapperOuterStyles,
  wrapperInnerStyles,
}: {
  children: React.ReactNode;
  menu: React.ReactNode;
  stopPropagation?: boolean;
  wrapperOuterStyles?: React.CSSProperties;
  wrapperInnerStyles?: React.CSSProperties;
}) => {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<{
    x: number;
    y: number;
    anchor: 'left' | 'right';
  }>({
    anchor: 'left',
    x: 0,
    y: 0,
  });

  const showMenu = (e: React.MouseEvent) => {
    const anchor = window.innerWidth - e.pageX < 240 ? 'right' : 'left';
    e.preventDefault();
    setMenuPosition({
      x: anchor === 'left' ? e.pageX : window.innerWidth - e.pageX,
      y: e.pageY,
      anchor,
    });

    if (!menuVisible) {
      setMenuVisible(true);
      document.dispatchEvent(new CustomEvent(CONTEXT_MENU_EVENT));
    }
    if (stopPropagation) {
      e.stopPropagation();
    }
  };

  const hideMenu = () => {
    setMenuVisible(false);
  };
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const node = ref.current;
    const listener = (e: MouseEvent) => {
      if (ref.current && e.target && !ref.current.contains(e.target as Node)) {
        hideMenu();
      }
    };
    const keydownListener = (e: KeyboardEvent) => {
      if (ref.current && e.code === 'Escape') {
        hideMenu();
      }
    };
    if (menuVisible && node) {
      document.body.addEventListener('click', listener);
      document.body.addEventListener('keydown', keydownListener);
      document.body.addEventListener('contextmenu', listener);
      document.addEventListener(CONTEXT_MENU_EVENT, listener as any);
    }
    return () => {
      if (node) {
        document.body.removeEventListener('click', listener);
        document.body.removeEventListener('keydown', keydownListener);
        document.body.removeEventListener('contextmenu', listener);
        document.removeEventListener(CONTEXT_MENU_EVENT, listener as any);
      }
    };
  }, [menuVisible]);

  return (
    <div ref={ref} style={wrapperOuterStyles}>
      <div onContextMenu={showMenu} onClick={hideMenu} style={wrapperInnerStyles}>
        {children}
      </div>
      {menuVisible
        ? ReactDOM.createPortal(
            <div
              style={{
                position: 'absolute',
                top: menuPosition.y,
                left: menuPosition.anchor === 'left' ? menuPosition.x : 'unset',
                right: menuPosition.anchor === 'right' ? menuPosition.x : 'unset',
                backgroundColor: Colors.popoverBackground(),
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                zIndex: 10,
                borderRadius: '4px',
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {menu}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};

export const triggerContextMenu = (e: React.MouseEvent) => {
  const evt = new MouseEvent('contextmenu', e.nativeEvent);
  e.target.dispatchEvent(evt);
  e.stopPropagation();
  e.preventDefault();
};
