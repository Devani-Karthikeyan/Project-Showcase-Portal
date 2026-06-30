import { EventEmitter } from 'events';

class EventBus extends EventEmitter {}

const eventBus = new EventBus();

// Maximize listeners limit for safety in case of multiple subscribers
eventBus.setMaxListeners(20);

// Event constant names
export const EVENTS = {
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_LIKED: 'PROJECT_LIKED',
  PROJECT_APPROVED: 'PROJECT_APPROVED',
  FEEDBACK_ADDED: 'FEEDBACK_ADDED',
  USER_FOLLOWED: 'USER_FOLLOWED'
};

export default eventBus;
