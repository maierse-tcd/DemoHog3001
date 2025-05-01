
# Admin Navigation Integration Instructions

To integrate the AdminNavItems component into your Navbar:

1. Import the AdminNavItems component in your Navbar.tsx file:
```jsx
import { AdminNavItems } from './AdminNavItems';
```

2. Add the AdminNavItems component to your Navbar, typically between the main navigation links and the user controls:
```jsx
{/* Main navigation links */}
<div className="flex items-center space-x-6">
  <Link to="/" className="text-white hover:text-netflix-red transition-colors">Home</Link>
  <Link to="/movies" className="text-white hover:text-netflix-red transition-colors">Movies</Link>
  <Link to="/series" className="text-white hover:text-netflix-red transition-colors">Series</Link>
  
  {/* Admin navigation items - will only appear if the user has the is_admin feature flag */}
  <AdminNavItems />
</div>
```

This integration ensures that:
- The Image Manager link will only appear for users with the 'is_admin' feature flag enabled
- The link disappears immediately when a user logs out
- Users without admin privileges will not see the option at all
