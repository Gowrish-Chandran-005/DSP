/**
 * In-Memory Assessment History Store
 * Temporarily persists assessment and prediction records in a JavaScript Map.
 * Note: Records are stored in memory and reset upon server restart.
 */

const crypto = require('crypto');

class AssessmentStore {
  constructor() {
    this.store = new Map();
  }

  /**
   * Adds an assessment record to memory.
   * @param {Object} entry - { type, model, prediction }
   * @returns {Object} Created record including id and createdAt
   */
  add({ type, model, prediction }) {
    const id = crypto.randomUUID();
    const record = {
      id,
      type,
      model,
      prediction,
      createdAt: new Date().toISOString(),
    };
    this.store.set(id, record);
    return record;
  }

  /**
   * Retrieves all assessment records sorted newest first.
   * @returns {Array<Object>}
   */
  getAll() {
    return Array.from(this.store.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Retrieves a single record by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getById(id) {
    return this.store.get(id) || null;
  }

  /**
   * Deletes a record by ID.
   * @param {string} id
   * @returns {boolean} True if deleted, false if record did not exist
   */
  deleteById(id) {
    return this.store.delete(id);
  }

  /**
   * Clears all records (useful for test isolation).
   */
  clear() {
    this.store.clear();
  }
}

// Export singleton instance and class definition
const defaultStore = new AssessmentStore();

module.exports = {
  AssessmentStore,
  defaultStore,
};
