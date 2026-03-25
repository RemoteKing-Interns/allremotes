// Fraud detection and velocity limiting utilities

class FraudDetection {
  constructor() {
    this.orderAttempts = new Map(); // Track orders per IP/email
    this.suspiciousPatterns = new Set();
  }

  // Check for suspicious order patterns
  async validateOrder(orderData) {
    const warnings = [];
    const riskScore = this.calculateRiskScore(orderData);

    // High-value order check
    if (orderData.amount > 1000) {
      warnings.push('High-value order detected');
    }

    // Multiple orders to same address
    const addressKey = `${orderData.shippingAddress?.address}_${orderData.shippingAddress?.city}`;
    const recentOrders = this.getRecentOrdersByAddress(addressKey);
    if (recentOrders > 3) {
      warnings.push('Multiple orders to same address');
    }

    // Different billing and shipping addresses
    if (this.addressesDiffer(orderData.billingAddress, orderData.shippingAddress)) {
      warnings.push('Billing and shipping addresses differ');
    }

    // Velocity check (too many orders from same IP)
    const ipOrders = this.getRecentOrdersByIP(orderData.ip);
    if (ipOrders > 5) {
      warnings.push('High order velocity from IP');
    }

    // International order (if you only ship domestically)
    if (orderData.shippingAddress?.country !== 'AU') {
      warnings.push('International shipping address');
    }

    return {
      riskScore,
      warnings,
      isSuspicious: riskScore > 70 || warnings.length > 2,
      requiresManualReview: riskScore > 80 || warnings.length > 3,
    };
  }

  calculateRiskScore(orderData) {
    let score = 0;

    // Base score
    score += 10;

    // Amount-based scoring
    if (orderData.amount > 500) score += 20;
    if (orderData.amount > 1000) score += 30;

    // New customer penalty
    if (orderData.isNewCustomer) score += 15;

    // Address mismatch
    if (this.addressesDiffer(orderData.billingAddress, orderData.shippingAddress)) {
      score += 25;
    }

    // No phone number
    if (!orderData.customerPhone) score += 10;

    // Rush shipping (if available)
    if (orderData.shippingMethod === 'express') score += 15;

    return Math.min(score, 100);
  }

  addressesDiffer(billing, shipping) {
    if (!billing || !shipping) return false;
    
    return (
      billing.address !== shipping.address ||
      billing.city !== shipping.city ||
      billing.postcode !== shipping.postcode
    );
  }

  getRecentOrdersByAddress(addressKey) {
    // In production, this would query your database
    // For now, return mock data
    return Math.floor(Math.random() * 5);
  }

  getRecentOrdersByIP(ip) {
    // In production, this would query your database
    // For now, return mock data
    return Math.floor(Math.random() * 10);
  }

  // Log suspicious activity
  logSuspiciousActivity(orderData, riskAnalysis) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      orderId: orderData.id,
      riskScore: riskAnalysis.riskScore,
      warnings: riskAnalysis.warnings,
      customerEmail: orderData.customerEmail,
      amount: orderData.amount,
      ip: orderData.ip,
    };

    console.warn('🚨 FRAUD DETECTION ALERT:', JSON.stringify(logEntry, null, 2));
    
    // In production, save to database or send alert
    // await this.sendAlertToAdmin(logEntry);
  }

  // Check if order should be blocked
  shouldBlockOrder(orderData, riskAnalysis) {
    // Block orders with very high risk score
    if (riskAnalysis.riskScore > 90) return true;

    // Block orders with multiple red flags
    if (riskAnalysis.warnings.length > 4) return true;

    // Block orders from known suspicious IPs (in production)
    // if (this.isSuspiciousIP(orderData.ip)) return true;

    return false;
  }
}

export default FraudDetection;
