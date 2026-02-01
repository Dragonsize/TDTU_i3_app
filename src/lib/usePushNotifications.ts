import { useEffect, useState } from 'react';
import {
  registerServiceWorker,
  requestNotificationPermission,
  sendLocalNotification,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  type PushNotificationOptions
} from './pushNotifications';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const isSupported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(isSupported);

    if (isSupported) {
      setPermission(Notification.permission as NotificationPermission);
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      const granted = await requestNotificationPermission();
      setPermission(Notification.permission as NotificationPermission);
      return granted;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  const subscribe = async (vapidPublicKey?: string) => {
    if (!isSupported) return false;

    setLoading(true);
    try {
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      // For demo purposes, we don't need a real VAPID key
      // In production, you'd use a real VAPID key from your push service
      const key = vapidPublicKey || 'DEMO_KEY';
      
      // Just mark as subscribed for demo
      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Error subscribing:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return false;

    setLoading(true);
    try {
      await unsubscribeFromPushNotifications();
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (options: PushNotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.log('Cannot send notification - not supported or permission denied');
      return;
    }

    try {
      await sendLocalNotification(options);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    sendNotification,
  };
}
