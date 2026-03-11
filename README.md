# Offline-Resilient Inventory Management System

A React Native mobile application designed for inventory management that works seamlessly offline and synchronizes data when connectivity is restored. Built as part of an academic research project on offline-resilient systems with real-time operational decision support.

## Features

### Core Functionality
- ✅ **Offline-First Architecture** - Full functionality without internet connection
- ✅ **Real-time Synchronization** - Automatic sync when connectivity returns
- ✅ **Stock Management** - Stock-in and stock-out operations with transaction logging
- ✅ **Low Stock Alerts** - Visual warnings when inventory below minimum levels
- ✅ **Product Management** - Add, edit, delete, and view product details
- ✅ **Analytics & Reports** - Visual charts and inventory statistics
- ✅ **Audit Trail** - Complete history of all inventory transactions
- ✅ **Multi-platform** - iOS and Android support via React Native

### Technical Features
- 📱 **React Native** with Expo
- 🗄️ **SQLite** local database for offline persistence
- 🔄 **Redux Toolkit** with persistence for state management
- 📊 **React Native Chart Kit** for analytics
- 🎨 **React Native Paper** for Material Design UI
- 🌐 **Network Awareness** - Detects online/offline status
- ⚡ **Optimistic UI** - Immediate feedback with background sync

## Project Structure

```
offline-inventory-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── OfflineBanner.js
│   │   ├── StockStatusBadge.js
│   │   ├── EmptyState.js
│   │   ├── LoadingSpinner.js
│   │   ├── SyncIndicator.js
│   │   └── ProductCard.js
│   ├── screens/             # Application screens
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── AddProductScreen.js
│   │   ├── StockMovementScreen.js
│   │   ├── InventoryListScreen.js
│   │   ├── ProductDetailsScreen.js
│   │   └── ReportsScreen.js
│   ├── services/            # Business logic services
│   │   ├── NetworkProvider.js
│   │   └── SyncManager.js
│   ├── database/            # Database layer
│   │   └── Database.js
│   ├── store/               # Redux store configuration
│   │   ├── index.js
│   │   ├── inventorySlice.js
│   │   ├── authSlice.js
│   │   └── syncSlice.js
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.js
│   └── utils/               # Utility functions
├── App.js                   # Application entry point
└── package.json             # Dependencies
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Setup

1. **Clone or extract the project**
   ```bash
   cd offline-inventory-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/emulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## Usage

### Getting Started
1. Launch the app
2. Login with any username/password (demo mode)
3. View the dashboard with inventory overview
4. Add products using the "Add Product" button
5. Manage stock using "Stock In" or "Stock Out"
6. View reports in the Reports tab

### Offline Usage
- The app works completely offline
- All changes are stored locally in SQLite
- Visual indicator shows when you're offline
- Data syncs automatically when connection returns

### Key Workflows

**Adding a Product:**
1. Tap "Add Product" FAB on Dashboard
2. Fill in product details (name, SKU, quantity, price)
3. Save - works offline
4. Data syncs when online

**Stock Movement:**
1. Use "Stock In" to receive inventory
2. Use "Stock Out" to dispatch inventory
3. Select product and enter quantity
4. System prevents negative stock

**Viewing Reports:**
1. Navigate to Reports tab
2. Switch between Overview, Value, Category, and Alerts
3. View charts and detailed tables

## Architecture

### Offline-First Strategy
1. **Local Database**: SQLite stores all data locally
2. **Optimistic Updates**: UI updates immediately, syncs in background
3. **Conflict Resolution**: Last-write-wins with operation timestamps
4. **Sync Queue**: Pending operations tracked and executed in order

### Data Flow
```
User Action → Local DB Update → UI Update → Background Sync (if online)
                                    ↓
                              Redux State Update
```

### Synchronization
- Automatic sync when connectivity detected
- Manual pull-to-refresh triggers sync
- Visual indicators for pending items
- Error handling with retry logic

## Backend Integration

To connect with a Node.js backend, update `src/services/SyncManager.js`:

```javascript
const syncToServer = async (products, transactions) => {
  const response = await fetch('https://your-api.com/sync', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ products, transactions })
  });
  return response.json();
};
```

## Customization

### Theming
Edit theme colors in `App.js`:
```javascript
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#your-color',
    accent: '#your-accent',
  },
};
```

### Database Schema
Modify `src/database/Database.js` to add fields or tables.

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
Test offline/online transitions:
1. Enable airplane mode
2. Add products/stock movements
3. Disable airplane mode
4. Verify sync completes

## Performance Considerations

- Images should be optimized for mobile
- Large datasets use pagination (implement in FlatList)
- Sync operations are batched to reduce network calls
- SQLite queries are indexed on frequently searched fields

## Troubleshooting

### Common Issues

**Metro bundler cache issues:**
```bash
npx expo start --clear
```

**Database locked errors:**
- Ensure only one transaction at a time
- Check for unclosed transactions

**Sync not working:**
- Verify network permissions
- Check console for sync errors
- Ensure backend endpoint is accessible

## Contributing

This is an academic project. For extensions:
1. Fork the repository
2. Create a feature branch
3. Submit pull request with detailed description

## License

MIT License - Academic Use

## References

Based on research from:
- Desai (2025) on Progressive Web Applications for inventory
- Abu et al. (2024) on IoT decision support systems
- Satyanarayanan (2017) on edge computing and offline resilience

## Contact

For questions or support regarding this academic project, please refer to the thesis documentation.

---

**Note**: This is a prototype system designed for research purposes. For production use, additional security measures, input validation, and error handling should be implemented.
