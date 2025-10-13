import json
import logging
import os
from typing import Optional

from kafka import KafkaProducer
from kafka.errors import KafkaError

logger = logging.getLogger(__name__)


class KafkaProducerService:
    _instance: Optional["KafkaProducerService"] = None
    _producer: Optional[KafkaProducer] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(KafkaProducerService, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if self._producer is None:
            self._initialize_producer()

    def _initialize_producer(self):
        """Initialize Kafka producer with retry logic"""
        broker = os.getenv("KAFKA_BROKER", "localhost:9092")

        try:
            self._producer = KafkaProducer(
                bootstrap_servers=[broker],
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None,
                acks="all",  # Wait for all replicas to acknowledge
                retries=3,
                max_in_flight_requests_per_connection=1,
                request_timeout_ms=30000,
                api_version=(2, 5, 0),
            )
            logger.info(
                f"Kafka producer initialized successfully. Broker: {broker}"
            )
        except Exception as e:
            logger.error(f"Failed to initialize Kafka producer: {e}")
            self._producer = None

    def send_message(
        self, topic: str, message: dict, key: Optional[str] = None
    ) -> bool:
        """
        Send a message to a Kafka topic

        Args:
            topic: Kafka topic name
            message: Message payload (dict)
            key: Optional message key for partitioning

        Returns:
            bool: True if message sent successfully, False otherwise
        """
        if self._producer is None:
            logger.error("Kafka producer not initialized. Message not sent.")
            return False

        try:
            future = self._producer.send(topic, value=message, key=key)

            # Block until message is sent or timeout
            record_metadata = future.get(timeout=10)

            logger.info(
                f"Message sent to topic '{topic}' "
                f"[partition: {record_metadata.partition}, "
                f"offset: {record_metadata.offset}]"
            )
            return True

        except KafkaError as e:
            logger.error(f"Failed to send message to topic '{topic}': {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending message: {e}")
            return False

    def send_traffic_report(self, report_data: dict) -> bool:
        """
        Send traffic report to Kafka topic

        Args:
            report_data: Traffic report data

        Returns:
            bool: True if sent successfully
        """
        return self.send_message(
            topic="traffic-reports",
            message=report_data,
            key=report_data.get("reportId"),
        )

    def close(self):
        """Close the Kafka producer"""
        if self._producer:
            try:
                self._producer.flush()
                self._producer.close()
                logger.info("Kafka producer closed successfully")
            except Exception as e:
                logger.error(f"Error closing Kafka producer: {e}")


# Singleton instance
kafka_producer = KafkaProducerService()
