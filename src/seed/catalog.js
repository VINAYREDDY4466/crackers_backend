export const categories = [
  { name: 'Kids Crackers', description: 'Mild, colourful picks for children, always with an adult nearby.', ageGroup: 'kids', displayOrder: 1, image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=900&q=70' },
  { name: 'Sparklers', description: 'Classic hand sparklers for the first light of the evening.', ageGroup: 'family', displayOrder: 2, image: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&w=900&q=70' },
  { name: 'Flower Pots', description: 'Ground fountains that bloom into a shower of sparks.', ageGroup: 'family', displayOrder: 3, image: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?auto=format&fit=crop&w=900&q=70' },
  { name: 'Ground Chakkars', description: 'Spinning ground wheels for courtyards and terraces.', ageGroup: 'family', displayOrder: 4, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=70' },
  { name: 'Rockets', description: 'Sky rockets meant for open grounds and adult handling.', ageGroup: 'adults', displayOrder: 5, image: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&w=900&q=70' },
  { name: 'Fancy Crackers', description: 'Colour shots and special effects for the main celebration.', ageGroup: 'family', displayOrder: 6, image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=900&q=70' },
  { name: 'Sound Crackers', description: 'Louder crackers for customers who want the traditional burst.', ageGroup: 'adults', displayOrder: 7, image: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?auto=format&fit=crop&w=900&q=70' },
  { name: 'Gift Boxes', description: 'Ready assortments to carry to family and friends.', ageGroup: 'family', displayOrder: 8, image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=900&q=70' },
  { name: 'Family Packs', description: 'Balanced packs for a full evening at home.', ageGroup: 'family', displayOrder: 9, image: 'https://images.unsplash.com/photo-1478144592103-25e218a04891?auto=format&fit=crop&w=900&q=70' },
  { name: 'Combo Packs', description: 'Larger mixes when the whole street is celebrating.', ageGroup: 'family', displayOrder: 10, image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=900&q=70' },
];

export const products = [
  { name: 'Colour Sparkler Pack', unit: '1 Box (10 pcs)', category: 'Sparklers', ageGroup: 'kids', originalPrice: 180, discountPercentage: 10, stockStatus: 'in_stock', stockQuantity: 80, description: 'A small pack of low-spark hand sparklers suited to children, with an adult lighting every stick.' },
  { name: 'Kids Colour Cones', unit: '1 Box (5 pcs)', category: 'Kids Crackers', ageGroup: 'kids', originalPrice: 250, discountPercentage: 0, stockStatus: 'in_stock', stockQuantity: 40, description: 'Short colour cones that stay on the ground. Made for family courtyards, not for children to light alone.' },
  { name: 'Flower Pot Special', unit: '1 Box (10 pcs)', category: 'Flower Pots', ageGroup: 'family', originalPrice: 625, discountPercentage: 20, stockStatus: 'in_stock', stockQuantity: 55, description: 'A steady ground fountain with a gold and green bloom. Place it on flat concrete, away from clothes and decorations.' },
  { name: 'Twin Flower Pot', unit: '2 pcs', category: 'Flower Pots', ageGroup: 'family', originalPrice: 900, discountPercentage: 15, stockStatus: 'low_stock', stockQuantity: 8, description: 'Two large flower pots packed together for the start and the close of the evening.' },
  { name: 'Ground Chakkar Deluxe', unit: '1 Box (10 pcs)', category: 'Ground Chakkars', ageGroup: 'family', originalPrice: 320, discountPercentage: 0, stockStatus: 'in_stock', stockQuantity: 60, description: 'Spinning ground wheels with a bright ring of sparks. Use them only on an open floor.' },
  { name: 'Rocket Pack', unit: '1 Box (10 pcs)', category: 'Rockets', ageGroup: 'adults', originalPrice: 500, discountPercentage: 20, stockStatus: 'in_stock', stockQuantity: 35, description: 'A pack of sky rockets for open grounds. Adults should fix the stick in a bottle and keep everyone clear.' },
  { name: 'Whistling Rocket Trio', unit: '3 pcs', category: 'Rockets', ageGroup: 'adults', originalPrice: 750, discountPercentage: 10, stockStatus: 'in_stock', stockQuantity: 20, description: 'Three whistling rockets with a high trail. Not for terraces, balconies, or crowded lanes.' },
  { name: 'Peacock Fancy Shots', unit: '1 Box (12 shots)', category: 'Fancy Crackers', ageGroup: 'family', originalPrice: 1100, discountPercentage: 18, stockStatus: 'in_stock', stockQuantity: 24, description: 'Multi-colour fancy shots that fan out above the compound. Best saved for the main lighting round.' },
  { name: 'Golden Rain Candle', unit: '1 pc', category: 'Fancy Crackers', ageGroup: 'family', originalPrice: 280, discountPercentage: 0, stockStatus: 'in_stock', stockQuantity: 48, description: 'A single candle fountain with a warm golden fall. Compact enough for a small terrace if local rules allow.' },
  { name: 'Classic Sound Strip', unit: '1 Strip (100 wala)', category: 'Sound Crackers', ageGroup: 'adults', originalPrice: 450, discountPercentage: 5, stockStatus: 'in_stock', stockQuantity: 30, description: 'A traditional sound strip. Check local noise timings before you light it, and keep children indoors.' },
  { name: 'Lakshmi Sound Pack', unit: '1 Box (10 pcs)', category: 'Sound Crackers', ageGroup: 'adults', originalPrice: 980, discountPercentage: 12, stockStatus: 'out_of_stock', stockQuantity: 0, description: 'A louder assortment for open fields. Currently waiting on the next stock delivery.' },
  { name: 'Festive Gift Box', unit: '1 Gift box (25 items)', category: 'Gift Boxes', ageGroup: 'family', originalPrice: 2500, discountPercentage: 15, stockStatus: 'in_stock', stockQuantity: 18, description: 'A gift-ready mix of sparklers, flower pots, and chakkars. The box is packed to hand over as it is.' },
  { name: 'Neighbour Gift Box', unit: '1 Gift box (12 items)', category: 'Gift Boxes', ageGroup: 'kids', originalPrice: 1200, discountPercentage: 10, stockStatus: 'in_stock', stockQuantity: 22, description: 'A milder gift box with sparklers and colour cones, meant for families with younger children.' },
  { name: 'Home Family Pack', unit: '1 Pack (30 items)', category: 'Family Packs', ageGroup: 'family', originalPrice: 1800, discountPercentage: 10, stockStatus: 'in_stock', stockQuantity: 26, description: 'Enough variety for a two-hour family evening: sparklers, pots, chakkars, and one fancy shot.' },
  { name: 'Courtyard Family Pack', unit: '1 Pack (45 items)', category: 'Family Packs', ageGroup: 'family', originalPrice: 2400, discountPercentage: 20, stockStatus: 'low_stock', stockQuantity: 6, description: 'A fuller family pack for a larger courtyard, with extra flower pots and sparklers.' },
  { name: 'Street Combo Pack', unit: '1 Combo (60 items)', category: 'Combo Packs', ageGroup: 'adults', originalPrice: 4200, discountPercentage: 18, stockStatus: 'in_stock', stockQuantity: 12, description: 'A large combo for a shared celebration. Includes rockets and sound crackers, so an adult should be in charge.' },
];

export const marqueeItems = [
  'Diwali 2026 bookings are open. Order on WhatsApp in under a minute.',
  'Direct Sivakasi prices with up to 20% off on selected packs.',
  'No login needed. Add to cart, share your address, and send on WhatsApp.',
  'Payment is confirmed with our team after you send the order.',
  'Celebrate safely: light crackers in open spaces with an adult nearby.',
];

export const banners = [
  {
    title: 'Diwali 2026 bookings are open',
    subtitle: 'Up to 20% off on family packs and gift boxes. Order in a minute on WhatsApp.',
    buttonLabel: 'Shop offers',
    linkUrl: '/offers',
    imageUrl: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=1600&q=70',
  },
  {
    title: 'Gift boxes for every home',
    subtitle: 'Ready-packed assortments to carry to family and friends.',
    buttonLabel: 'View gift boxes',
    linkUrl: '/categories/gift-boxes',
    imageUrl: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1600&q=70',
  },
  {
    title: 'Gentle picks for kids',
    subtitle: 'Mild sparklers and colour cones, always with an adult beside them.',
    buttonLabel: 'Shop for kids',
    linkUrl: '/products?ageGroup=kids',
    imageUrl: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&w=1600&q=70',
  },
];
