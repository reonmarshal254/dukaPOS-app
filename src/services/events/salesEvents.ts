/**
 * Sales event emitter for real-time updates
 * Notifies subscribers when sales are created
 */

type SaleEventListener = (saleId: string) => void;

class SalesEventEmitter {
  private listeners: SaleEventListener[] = [];

  /**
   * Subscribe to sale creation events
   */
  subscribe(listener: SaleEventListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Emit a sale created event
   */
  emit(saleId: string): void {
    this.listeners.forEach(listener => {
      try {
        listener(saleId);
      } catch (error) {
        console.error('Error in sale event listener:', error);
      }
    });
  }

  /**
   * Get number of active listeners (for debugging)
   */
  getListenerCount(): number {
    return this.listeners.length;
  }
}

// Singleton instance
export const salesEvents = new SalesEventEmitter();

