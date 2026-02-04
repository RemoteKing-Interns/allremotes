// Import remote images
import remote1 from '../Remotes/001_s-l140.webp';
import remote2 from '../Remotes/002_s-l500.webp';
import remote3 from '../Remotes/003_s-l140.webp';
import remote4 from '../Remotes/004_s-l140.webp';
import remote5 from '../Remotes/005_s-l140.webp';
import remote6 from '../Remotes/006_s-l500.webp';
import remote7 from '../Remotes/007_s-l500.webp';
import remote8 from '../Remotes/008_s-l500.webp';
import remote9 from '../Remotes/009_s-l500.webp';
import remote10 from '../Remotes/010_s-l500.webp';
import remote11 from '../Remotes/011_s-l500.webp';
import remote12 from '../Remotes/012_s-l500.webp';

// Real product data with actual prices and details
export const products = [
  // Garage/Gate Remotes
  {
    id: '1',
    name: 'Merlin+ 2.0 E970M/E975M Genuine Remote',
    category: 'garage',
    price: 51.80,
    image: remote1,
    description: 'Genuine Merlin+ 2.0 E970M/E975M remote control for garage and gate automation. Brand new condition with full compatibility.',
    inStock: true,
    brand: 'Merlin',
    condition: 'Brand New',
    returns: 'No returns accepted',
    seller: 'AllRemotes (100% positive)',
  },
  {
    id: '2',
    name: 'Avanti/Centurion/Superlift/GNS Genuine/Matador 4 Btn Remote',
    category: 'garage',
    price: 63.50,
    image: remote2,
    description: 'Genuine 4-button remote control compatible with Avanti, Centurion, Superlift, GNS, and Matador systems. Perfect for garage and gate automation.',
    inStock: true,
    brand: 'Avanti/Centurion',
    condition: 'Brand New',
    returns: 'No returns accepted',
    seller: 'AllRemotes (100% positive)',
  },
  {
    id: '3',
    name: 'DACE Genuine Duratronic EXO1 Grey Gate Remote',
    category: 'garage',
    price: 44.80,
    image: remote3,
    description: 'Genuine DACE Duratronic EXO1 grey gate remote control. High-quality construction for reliable gate automation.',
    inStock: true,
    brand: 'DACE',
    condition: 'Brand New',
    returns: 'No returns accepted',
    seller: 'AllRemotes (100% positive)',
  },
  {
    id: '4',
    name: 'DEA Ziggy GT2 Genuine Remote Control',
    category: 'garage',
    price: 48.50,
    image: remote4,
    description: 'Genuine DEA Ziggy GT2 remote control for garage door systems. Reliable and easy to program.',
    inStock: true,
    brand: 'DEA',
    condition: 'Brand New',
    returns: 'No returns accepted',
    seller: 'AllRemotes (100% positive)',
  },
  {
    id: '5',
    name: 'Lexo Automation PR4 Genuine Remote',
    category: 'garage',
    price: 39.70,
    image: remote5,
    description: 'Genuine Lexo Automation PR4 remote control. Compatible with Lexo garage door systems.',
    inStock: true,
    brand: 'Lexo',
    condition: 'Brand New',
    returns: 'No returns accepted',
    seller: 'AllRemotes (100% positive)',
  },
  {
    id: '6',
    name: 'Boss/Steel-Line HT3 Garage Door Remote',
    category: 'garage',
    price: 34.40,
    image: remote6,
    description: 'Boss/Steel-Line HT3 garage door remote control. Compatible with Boss and Steel-Line garage door systems.',
    inStock: true,
    brand: 'Boss/Steel-Line',
    condition: 'Brand New',
    returns: 'No returns accepted',
    seller: 'AllRemotes (100% positive)',
  },
  {
    id: '7',
    name: 'Chamberlain Universal Remote Control MC100AMLR',
    category: 'garage',
    price: 55.80,
    image: remote7,
    description: 'Chamberlain universal remote control MC100AMLR. Works with most Chamberlain garage door openers.',
    inStock: true,
    brand: 'Chamberlain',
    condition: 'Brand New',
    returns: 'No returns accepted',
    seller: 'AllRemotes (100% positive)',
  },
  {
    id: '8',
    name: 'Merlin M842RS 2 Btn Garage Remote',
    category: 'garage',
    price: 41.70,
    image: remote8,
    description: 'Merlin M842RS 2-button garage remote control. Brand new condition with bulk pricing available. Compatible with Merlin garage door systems.',
    inStock: true,
    brand: 'Merlin',
    condition: 'Brand New',
    returns: 'No returns accepted',
    seller: 'AllRemotes (100% positive)',
    bulkPricing: true,
  },
  {
    id: '9',
    name: 'ATA Genuine PTX-4 Securacode Remote',
    category: 'garage',
    price: 33.99,
    image: remote9,
    description: 'ATA Genuine PTX-4 Securacode garage/gate remote control. New condition with advanced security features.',
    inStock: true,
    brand: 'ATA',
    condition: 'New',
    returns: 'No returns accepted',
    seller: 'AllRemotes (100% positive)',
  },
  // Vehicle Remotes
  {
    id: '10',
    name: 'Ford BA/BF Falcon Territory Remote (2+1)',
    category: 'car',
    price: 8.20,
    image: remote10,
    description: 'Ford BA/BF Falcon Territory remote control (2+1 button). Compatible with Ford BA and BF Falcon models and Territory vehicles.',
    inStock: true,
    brand: 'Ford',
    condition: 'Brand New',
    returns: 'No returns accepted',
    seller: 'AllRemotes (100% positive)',
  },
  {
    id: '11',
    name: 'Universal Car Remote Key Fob',
    category: 'car',
    price: 29.99,
    image: remote11,
    description: 'Universal car remote key fob compatible with most vehicle brands. Features lock, unlock, and panic buttons.',
    inStock: true,
    brand: 'Universal',
    condition: 'Brand New',
    returns: '30 Day Returns',
    seller: 'AllRemotes (100% positive)',
  },
  {
    id: '12',
    name: 'Premium Car Remote Control',
    category: 'car',
    price: 49.99,
    image: remote12,
    description: 'High-quality car remote with advanced security features and long-range transmission. Compatible with multiple vehicle brands.',
    inStock: true,
    brand: 'Universal',
    condition: 'Brand New',
    returns: '30 Day Returns',
    seller: 'AllRemotes (100% positive)',
  },
];

export const getProductsByCategory = (category) => {
  if (category === 'all') return products;
  return products.filter(product => product.category === category);
};

export const getProductById = (id) => {
  return products.find(product => product.id === id);
};
