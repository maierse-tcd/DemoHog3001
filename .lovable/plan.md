

## PostHog Logs Integration

PostHog's "Logs" product captures console logs (console.log, console.warn, console.error, console.info) as part of session recordings. It requires one SDK config flag.

### Change

**File: `src/components/PostHogProvider/PostHogInitializer.tsx`**

Add `enable_recording_console_log: true` to the PostHog options object. This tells the SDK to capture all console output and attach it to session recordings, making them available in the PostHog Logs view.

```ts
options={{
  api_host: apiHost,
  persistence: 'localStorage' as const,
  capture_pageview: false,
  capture_pageleave: true,
  autocapture: true,
  disable_web_experiments: false,
  enable_recording_console_log: true, // ← new
  loaded: (posthogInstance: any) => { ... }
}}
```

Note: Session recording must also be enabled in your PostHog project settings for logs to be collected. The SDK captures raw console output directly, regardless of logging framework.

