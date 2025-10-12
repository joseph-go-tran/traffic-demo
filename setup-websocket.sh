#!/bin/bash

# WebSocket Setup Script
echo "🚀 Setting up WebSocket Notification System..."

# Navigate to notification service
echo ""
echo "📦 Installing notification service dependencies..."
cd notification_service
npm install

# Navigate to web service
echo ""
echo "📦 Installing web service dependencies..."
cd ../web_service
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Start the notification service: cd notification_service && npm run start:dev"
echo "2. Start the web service: cd web_service && npm run dev"
echo "3. Test by sending a notification: curl -X POST http://localhost:3000/notifications/send/all -H 'Content-Type: application/json' -d '{\"type\":\"info\",\"title\":\"Test\",\"message\":\"Hello World\"}'"
echo ""
echo "📚 See WEBSOCKET_INTEGRATION.md for full documentation"
