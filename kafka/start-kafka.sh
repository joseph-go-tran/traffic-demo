#!/bin/bash

echo "🚀 Starting Kafka + Services..."
echo ""

# Start Kafka
echo "📡 Starting Kafka & Zookeeper..."
docker compose up -d
cd ..

echo "⏳ Waiting for Kafka to be ready (30 seconds)..."
sleep 30


echo ""
echo "✅ Kafka is ready!"
echo ""
echo "📋 Services:"
echo "   - Kafka Broker: localhost:9092"
echo "   - Zookeeper: localhost:2181"
echo "   - Kafka UI: http://localhost:8080"
echo ""
echo "🎯 Next steps:"
echo "   1. Start Notification Service: cd notification_service && npm run start:dev"
echo "   2. Start Traffic Service: cd traffic_service && uvicorn main:app --reload --port 8002"
echo "   3. Start Web Service: cd web_service && npm run dev"
echo ""
echo "🧪 Test traffic report:"
echo "   ./test-kafka-integration.sh"
echo ""
