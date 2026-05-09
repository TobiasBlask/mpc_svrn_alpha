export class InMemoryAuditLog {
  #entries = [];

  async record(entry) {
    const normalized = Object.freeze({
      id: entry.id || `audit_${this.#entries.length + 1}`,
      occurredAt: entry.occurredAt || new Date().toISOString(),
      ...entry
    });

    this.#entries.push(normalized);
    return normalized;
  }

  async list() {
    return [...this.#entries];
  }
}
