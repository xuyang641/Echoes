import posthog from 'posthog-js';

// Initialize PostHog
export const initAnalytics = () => {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
      autocapture: true, // Automatically capture clicks, pageviews, etc.
      capture_pageview: true,
      capture_pageleave: true,
    });
    console.log('📊 PostHog Analytics initialized');
  } else {
    console.warn('⚠️ PostHog Key not found, analytics disabled');
  }
};

// Identify user after login
export const identifyUser = (userId: string, email?: string, name?: string) => {
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.identify(userId, {
      email: email,
      name: name,
    });
  }
};

// Reset after logout
export const resetAnalytics = () => {
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.reset();
  }
};

// Custom Event Tracking
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.capture(eventName, properties);
  }
};
