# Police Case Tracker PWA

A Progressive Web App for police inspectors to track cases and manage reminders offline using local storage.

## Features

### Case Management
- ✅ Create, read, update, delete cases
- ✅ Search and filter by status/priority
- ✅ Track case details (number, title, description, dates, notes)
- ✅ Manage case status (Open, In Progress, Under Investigation, Pending Court, Closed, Archived)
- ✅ Set priority levels (Low, Medium, High, Urgent)
- ✅ Pagination and sorting

### Reminders
- ✅ View all reminders with completion tracking
- ✅ Overdue reminders highlighted
- ✅ Toggle completion status
- ✅ Browser notification support

### Dashboard
- ✅ Statistics overview (total cases, open cases, reminders today, overdue)
- ✅ Quick action buttons
- ✅ Upcoming hearings (next 7 days)
- ✅ Upcoming/overdue reminders

### PWA Features
- ✅ Works 100% offline once loaded
- ✅ Installable on desktop and mobile
- ✅ Service worker caching
- ✅ IndexedDB for offline data storage
- ✅ Push notifications for reminders

## Technology Stack

- **Framework**: Angular 20.3
- **UI Library**: PrimeNG 20.2
- **Storage**: Dexie.js (IndexedDB wrapper)
- **PWA**: @angular/pwa with service workers
- **Icons**: PrimeIcons

## Project Structure

```
src/app/
├── models/
│   ├── case.model.ts           # Case data model with enums
│   └── reminder.model.ts       # Reminder data model with enums
├── services/
│   ├── database.service.ts     # Dexie IndexedDB service
│   ├── case.service.ts         # Case CRUD operations
│   └── reminder.service.ts     # Reminder CRUD operations
├── components/
│   ├── dashboard/              # Main dashboard view
│   ├── case-list/              # Cases listing with filters
│   ├── case-form/              # Create/edit case form
│   └── reminder-list/          # Reminders with completion tracking
└── app.routes.ts               # Application routing
```

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm

### Install Dependencies
```bash
npm install
```

## Development

### Run Development Server
```bash
ng serve
```

Navigate to `http://localhost:4200/`. The app will automatically reload when you make changes.

### Build for Production
```bash
ng build
```

Build artifacts will be stored in the `dist/` directory.

### Build and Serve PWA
```bash
ng build
npx http-server -p 8080 -c-1 dist/w-case-tracker/browser
```

Then navigate to `http://localhost:8080` to test PWA features like offline mode and installation.

## Usage

### Adding a New Case
1. Navigate to Dashboard
2. Click "New Case" button
3. Fill in case details (case number, title, description, status, priority, etc.)
4. Click "Create"

### Managing Reminders
1. Navigate to "Reminders" from the menu
2. View pending, overdue, and completed reminders
3. Check/uncheck to mark as complete
4. Delete reminders as needed

### Offline Usage
The app works completely offline after the first load:
- All data is stored in IndexedDB
- Service worker caches app resources
- No internet connection required for daily use

### Notifications
The app will request notification permission for reminders. Grant permission to receive browser notifications when reminders are due.

## Data Export/Import

The database service includes methods for:
- `exportData()` - Export all cases and reminders as JSON
- `importData(data)` - Import data from JSON
- `clearAllData()` - Clear all data (useful for testing)

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (iOS 12.2+)

## Security Notes

⚠️ This is a **client-side only application** for personal use:
- All data is stored **locally** in the browser's IndexedDB
- No server-side synchronization
- Data is not encrypted by default
- Suitable for personal, non-sensitive case tracking
- For sensitive data, consider implementing encryption

## Troubleshooting

### App not installing as PWA?
- Ensure you're using HTTPS or localhost
- Build for production (`ng build`)
- Serve from production build
- Check browser console for service worker errors

### Data not persisting?
- Check browser storage settings
- Ensure IndexedDB is not disabled
- Check for browser privacy/incognito mode

### Notifications not working?
- Grant notification permission when prompted
- Check browser notification settings
- Ensure service worker is registered

## Future Enhancements

Potential features to add:
- [ ] Reminder form to create new reminders
- [ ] Case-reminder linking in UI
- [ ] Bulk import/export functionality
- [ ] Data backup to cloud storage
- [ ] Search across all fields
- [ ] Advanced filtering
- [ ] Case attachments/documents
- [ ] Reporting and analytics
- [ ] Multi-user sync (requires backend)

## License

MIT License - Free for personal and commercial use

## Support

For issues or questions, please create an issue in the GitHub repository.
