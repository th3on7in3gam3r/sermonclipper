'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Notification = {
  _id: string;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = () => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => {
        setItems(d.notifications || []);
        setUnread(d.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <div className="notification-bell-wrap">
      <button type="button" className="notification-bell-btn" aria-label="Notifications" onClick={() => setOpen((v) => !v)}>
        🔔
        {unread > 0 && <span className="notification-badge">{unread}</span>}
      </button>
      {open && (
        <div className="notification-panel glass-card">
          <div className="notification-panel-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button
                type="button"
                className="notification-mark-all"
                onClick={() =>
                  fetch('/api/notifications', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ markAllRead: true }),
                  }).then(load)
                }
              >
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="notification-empty">No notifications yet.</p>
          ) : (
            <ul className="notification-list">
              {items.map((n) => (
                <li key={n._id} className={n.read ? '' : 'notification-unread'}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => {
                        markRead(n._id);
                        setOpen(false);
                      }}
                    >
                      {n.message}
                    </Link>
                  ) : (
                    <span>{n.message}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
