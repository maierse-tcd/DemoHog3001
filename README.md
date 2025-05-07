
# HogFlix - A PostHog Demo Application

HogFlix is a Netflix-style streaming platform that demonstrates PostHog integration for analytics, feature flags, and A/B testing.

## PostHog Integration

This application showcases how to implement PostHog functionality in a React application:

- Feature flags for toggling features
- A/B testing for experimenting with different UI variations
- Analytics for tracking user behavior
- Group analytics for segmenting users

For detailed documentation on the PostHog implementation, please see:

[PostHog Integration Guide](./PostHogIntegration.md)

## Feature Flags and A/B Testing

For comprehensive documentation on feature flags and A/B testing implementation, see:

[Feature Flags and A/B Testing Guide](./src/docs/FeatureFlagsAndABTesting.md)

## Getting Started

### Prerequisites

- Node.js & npm

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Key Features

- Modern streaming platform UI with Netflix-inspired design
- Feature flags to control functionality visibility
- A/B testing framework for experimentation
- User analytics and event tracking
- Responsive design for all devices

## Tech Stack

- React with TypeScript
- Tailwind CSS for styling
- PostHog for analytics, feature flags and A/B testing
- React Router for navigation
- Supabase for backend functionality

## PostHog Setup

To use PostHog in your own project:

1. Sign up for a [PostHog account](https://posthog.com/)
2. Create a new project in the PostHog dashboard
3. Copy your project's API key
4. Configure the PostHogProvider component with your API key

## Project Structure

```
src/
├── components/         # UI components
├── hooks/              # React hooks including PostHog hooks
├── pages/              # Page components
├── utils/
│   └── posthog/        # PostHog utility functions
├── contexts/           # Context providers
├── posthog/            # PostHog integration components
└── docs/               # Documentation
```

## License

This project is for demonstration purposes only.
