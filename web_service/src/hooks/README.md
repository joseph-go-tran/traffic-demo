# API Hooks Documentation

This document describes the organized API hooks structure using React Query (TanStack Query) and Axios.

## Structure

The hooks are organized by service domain:

```
src/hooks/
├── index.ts              # Main export file
├── queryKeys.ts          # Centralized query keys
├── useAuth.ts           # Authentication hooks
├── useRoutes.ts         # Route management hooks
├── useTraffic.ts        # Traffic data hooks
├── useUser.ts           # User profile and data hooks
└── useNotifications.ts  # Notification hooks
```

## Usage

### Import Options

You can import hooks in several ways:

```typescript
// Import from specific service
import { useLogin, useRegister } from './hooks/useAuth';
import { useCurrentTraffic } from './hooks/useTraffic';

// Import from main index (re-exports all hooks)
import { useLogin, useCurrentTraffic, useUserProfile } from './hooks';
```

### Authentication Hooks (`useAuth.ts`)

```typescript
// Login user
const loginMutation = useLogin();
await loginMutation.mutateAsync({ email, password });

// Register user
const registerMutation = useRegister();
await registerMutation.mutateAsync({ email, password, firstName, lastName });

// Logout user
const logoutMutation = useLogout();
await logoutMutation.mutateAsync();

// Refresh auth token
const refreshMutation = useRefreshToken();
await refreshMutation.mutateAsync();
```

### Route Hooks (`useRoutes.ts`)

```typescript
// Plan a new route
const planRouteMutation = usePlanRoute();
await planRouteMutation.mutateAsync({ from, to, preferences });

// Get all routes
const { data: routes, isLoading } = useRoutes();

// Get specific route
const { data: route } = useRoute(routeId);

// Update route preferences
const updatePreferencesMutation = useUpdateRoutePreferences();
await updatePreferencesMutation.mutateAsync({ routeId, preferences });
```

### Traffic Hooks (`useTraffic.ts`)

```typescript
// Get current traffic for location
const { data: traffic } = useCurrentTraffic({ lat: 40.7128, lng: -74.0060 });

// Get traffic incidents
const { data: incidents } = useTrafficIncidents();

// Report new incident
const reportMutation = useReportIncident();
await reportMutation.mutateAsync({ type, location, description });
```

### User Hooks (`useUser.ts`)

```typescript
// Get user profile
const { data: profile } = useUserProfile();

// Update user profile
const updateProfileMutation = useUpdateProfile();
await updateProfileMutation.mutateAsync(profileData);

// Get recent routes
const { data: recentRoutes } = useRecentRoutes();

// Get favorite routes
const { data: favoriteRoutes } = useFavoriteRoutes();

// Save route as favorite
const saveFavoriteMutation = useSaveFavoriteRoute();
await saveFavoriteMutation.mutateAsync(routeId);

// Get user statistics
const { data: stats } = useUserStats();
```

### Notification Hooks (`useNotifications.ts`)

```typescript
// Get all notifications
const { data: notifications } = useNotifications();

// Get unread notification count
const { data: count } = useNotificationCount();

// Mark notification as read
const markReadMutation = useMarkNotificationAsRead();
await markReadMutation.mutateAsync(notificationId);

// Mark all notifications as read
const markAllReadMutation = useMarkAllNotificationsAsRead();
await markAllReadMutation.mutateAsync();
```

## Query Keys

All query keys are centralized in `queryKeys.ts` for consistency and easy cache invalidation:

```typescript
import { queryKeys } from './hooks/queryKeys';

// Invalidate specific queries
queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
queryClient.invalidateQueries({ queryKey: queryKeys.routes });
```

## Features

### Automatic Cache Management
- Mutations automatically invalidate related queries
- Optimistic updates where appropriate
- Smart refetch intervals for real-time data

### Error Handling
- Built-in error handling via React Query
- Automatic retry logic for network failures
- Token refresh on 401 errors

### Performance Optimizations
- Stale time configuration to reduce unnecessary requests
- Background refetching for real-time data
- Selective data fetching with `enabled` conditions

### Development Tools
- React Query DevTools integration
- Comprehensive error states
- Loading states for all operations

## Migration from Old Structure

If migrating from the old `useApi.ts` file:

1. Update imports to use specific service hooks:
   ```typescript
   // Old
   import { useLogin } from './hooks/useApi';

   // New
   import { useLogin } from './hooks/useAuth';
   // or
   import { useLogin } from './hooks';
   ```

2. The hook APIs remain the same, so no changes to component logic are needed.

3. Query keys are now centralized in `queryKeys.ts` for better organization.
