import React from 'react';
import { createPortal } from 'react-dom';

/* ══════════════════════════════════════════════════════════════════
   HY-DRAWER.JSX  ·  Menu 3 gạch (hamburger) + ngăn kéo điều hướng
   Dùng chung cho index (học sinh) và admin.
   - window.HyBurger({onClick, open, dark})  → nút ≡
   - window.HyDrawer({open,onClose,items,active,onSelect,dark,title,footer})
       items: [{id,label,icon}]
   CSS: index/CSS/hyperos.css (.hy-burger, .hy-menu, .hy-drawer…)
══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function HyBurger({ onClick, open, dark, label }) {
    return (
      <button type="button" className={'hy-burger' + (dark ? ' dark' : '')} onClick={onClick}
        aria-label={label || 'Mở menu'} aria-expanded={!!open} aria-haspopup="dialog">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <line x1="4" y1="6.5" x2="20" y2="6.5" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17.5" x2="20" y2="17.5" />
        </svg>
      </button>
    );
  }

  function HyDrawer({ open, onClose, items, active, onSelect, dark, title, footer }) {
    React.useEffect(() => {
      if (!open) return undefined;
      const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
      document.addEventListener('keydown', onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = prev;
      };
    }, [open]);

    const tree = (
      <div className={'hy-menu' + (open ? ' open' : '') + (dark ? ' dark' : '')} aria-hidden={!open}>
        <div className="hy-scrim" onClick={onClose} />
        <aside className="hy-drawer" role="dialog" aria-label="Menu điều hướng">
          <div className="hy-drawer-head">
            <span className="hy-drawer-title">{title || 'Menu'}</span>
            <button type="button" className="hy-drawer-close" onClick={onClose} aria-label="Đóng menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.4" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
            </button>
          </div>
          <nav className="hy-drawer-list">
            {(items || []).map((it) => {
              const on = active === it.id;
              return (
                <button key={it.id} type="button" tabIndex={open ? 0 : -1}
                  className={'hy-drawer-item' + (on ? ' active' : '')}
                  onClick={() => onSelect && onSelect(it.id)}>
                  <span className="hy-drawer-ico">{it.icon}</span>
                  <span className="hy-drawer-label">{it.label}</span>
                  <i className="hy-chevron" />
                </button>
              );
            })}
          </nav>
          {footer ? <div className="hy-drawer-foot">{footer}</div> : null}
        </aside>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(tree, document.body) : null;
  }

  window.HyBurger = HyBurger;
  window.HyDrawer = HyDrawer;
})();
