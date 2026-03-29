import axios from 'axios';

class StarshipitAPI {
  constructor() {
    this.baseURL = 'https://api.starshipit.com/api';
    this.apiKey = process.env.STARSHIPIT_API_KEY;
    this.subscriptionKey = process.env.STARSHIPIT_SUBSCRIPTION_KEY;
    
    if (!this.apiKey || !this.subscriptionKey) {
      console.warn('Starshipit API keys not configured');
    }
  }

  // Create authenticated axios instance
  getClient() {
    if (!this.apiKey || !this.subscriptionKey) {
      throw new Error('Starshipit API keys not configured');
    }
    
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'StarShipIT-Api-Key': this.apiKey,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        'Content-Type': 'application/json',
      },
    });
  }

  // Get shipping rates for checkout
  async getRates(address) {
    try {
      const client = this.getClient();
      const response = await client.post('/rates', {
        origin: {
          address: 'Your Warehouse Address', // Set this in environment
          suburb: 'Your Suburb',
          city: 'Your City',
          postcode: 'Your Postcode',
          country: 'AU',
        },
        destination: {
          address: address.address || '',
          suburb: address.city || '',
          city: address.city || '',
          postcode: address.zipCode || '',
          country: address.country || 'AU',
        },
        items: [
          {
            weight: 0.5, // Default weight in kg
            length: 10,
            width: 10,
            height: 5,
          },
        ],
      });

      return response.data;
    } catch (error) {
      console.error('Starshipit rates error:', error.response?.data || error.message);
      throw new Error('Failed to fetch shipping rates');
    }
  }

  // Create order in Starshipit
  async createOrder(orderData) {
    try {
      const client = this.getClient();
      
      const starshipitOrder = {
        order_number: orderData.id,
        order_date: new Date().toISOString(),
        customer: {
          first_name: orderData.customer.fullName.split(' ')[0] || '',
          last_name: orderData.customer.fullName.split(' ').slice(1).join(' ') || '',
          email: orderData.customer.email,
          phone: orderData.customerPhone || '',
        },
        shipping_address: {
          address: orderData.shipping.address,
          address_2: '',
          suburb: orderData.shipping.city,
          city: orderData.shipping.city,
          postcode: orderData.shipping.zipCode,
          country: orderData.shipping.country || 'AU',
        },
        items: orderData.items.map(item => ({
          sku: item.id,
          name: item.name,
          quantity: item.quantity,
          weight: 0.5, // Default weight
          price: item.price,
        })),
        special_instructions: orderData.notes || '',
      };

      const response = await client.post('/orders', starshipitOrder);
      return response.data;
    } catch (error) {
      console.error('Starshipit order creation error:', error.response?.data || error.message);
      throw new Error('Failed to create order in Starshipit');
    }
  }

  // Generate shipping label
  async generateLabel(orderId, courierCode) {
    try {
      const client = this.getClient();
      const response = await client.post(`/orders/${orderId}/labels`, {
        courier_code: courierCode,
      });

      return response.data;
    } catch (error) {
      console.error('Starshipit label generation error:', error.response?.data || error.message);
      throw new Error('Failed to generate shipping label');
    }
  }

  // Get tracking information
  async getTracking(trackingNumber) {
    try {
      const client = this.getClient();
      const response = await client.get(`/tracking/${trackingNumber}`);
      return response.data;
    } catch (error) {
      console.error('Starshipit tracking error:', error.response?.data || error.message);
      throw new Error('Failed to fetch tracking information');
    }
  }

  // Get available couriers
  async getCouriers() {
    try {
      const client = this.getClient();
      const response = await client.get('/couriers');
      return response.data;
    } catch (error) {
      console.error('Starshipit couriers error:', error.response?.data || error.message);
      throw new Error('Failed to fetch available couriers');
    }
  }

  // Sync order status back from Starshipit
  async syncOrderStatus(orderId) {
    try {
      const client = this.getClient();
      const response = await client.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Starshipit order sync error:', error.response?.data || error.message);
      throw new Error('Failed to sync order status');
    }
  }

  // Validate address
  async validateAddress(address) {
    try {
      const client = this.getClient();
      const response = await client.post('/address/validate', {
        address: address.address,
        suburb: address.city,
        postcode: address.zipCode,
        country: address.country || 'AU',
      });

      return response.data;
    } catch (error) {
      console.error('Starshipit address validation error:', error.response?.data || error.message);
      return { valid: false, message: 'Address validation failed' };
    }
  }
}

export default StarshipitAPI;
