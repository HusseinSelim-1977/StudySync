const { Kafka } = require('kafkajs');
const crypto = require('crypto');

/**
 * Creates and returns a connected Kafka Producer
 * @param {string} clientId - unique client identifier for this producer
 * @returns {import('kafkajs').Producer}
 */
const createProducer = (clientId) => {
  const kafka = new Kafka({
    clientId: clientId || 'studysync-core',
    brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    retry: {
      initialRetryTime: 300,
      retries: 5
    }
  });
  return kafka.producer({
    allowAutoTopicCreation: true
  });
};

/**
 * Creates and returns a connected Kafka Consumer
 * @param {string} groupId
 * @returns {import('kafkajs').Consumer}
 */
const createConsumer = (groupId) => {
  const kafka = new Kafka({
    clientId: `${groupId}-consumer`,
    brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    retry: {
      initialRetryTime: 300,
      retries: 5
    }
  });
  return kafka.consumer({ groupId });
};

/**
 * Global Topic Constants
 */
const TOPICS = {
  USER_REGISTERED: 'USER_REGISTERED',
  PREFERENCES_UPDATED: 'PREFERENCES_UPDATED',
  AVAILABILITY_UPDATED: 'AVAILABILITY_UPDATED',
  BUDDY_REQUEST_CREATED: 'BUDDY_REQUEST_CREATED',
  BUDDY_REQUEST_ACCEPTED: 'BUDDY_REQUEST_ACCEPTED',
  SESSION_CREATED: 'SESSION_CREATED',
  SESSION_JOINED: 'SESSION_JOINED',
  SESSION_CANCELLED: 'SESSION_CANCELLED',
  MATCH_FOUND: 'MATCH_FOUND',
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
  MESSAGE_SENT: 'MESSAGE_SENT'
};

/**
 * Utility to format Kafka message payload
 */
const formatMessage = (eventName, producerService, payload, correlationId) => {
  return {
    eventName,
    timestamp: new Date().toISOString(),
    producerService,
    correlationId: correlationId || crypto.randomUUID(),
    payload
  };
};

module.exports = {
  createProducer,
  createConsumer,
  TOPICS,
  formatMessage
};
