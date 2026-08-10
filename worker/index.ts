declare let self: ServiceWorkerGlobalScope;

// Listen for incoming push messages from the server
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const title = data.title || 'BGMI Arena';
    const options: NotificationOptions = {
      body: data.body || 'You have a new update.',
      icon: '/icon-192.png', // Uses your PWA icon
      badge: '/icon-192.png', // Small icon for the Android top bar
      data: {
        url: data.url || '/dashboard', // Where to take the user when they click
      },
      vibrate: [200, 100, 200], // Haptic vibration pattern
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // Fallback if the payload isn't formatted properly
    event.waitUntil(
      self.registration.showNotification('BGMI Arena', {
        body: 'You have a new notification.',
        icon: '/icon-192.png',
      })
    );
  }
});

// Handle what happens when the user clicks the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If the app is already open in the background, focus it and go to the URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // If the app is completely closed, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
