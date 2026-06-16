require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, Product, User } = require('./db');

const seedData = async () => {
  // Initialize Database
  await connectDB();
  
  // Wait a short duration to ensure connection check is complete
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('Seeding database...');

  // 1. Seed Admin User
  console.log('Clearing old users...');
  await User.deleteMany({});
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await User.create({
    username: 'admin',
    password: hashedPassword
  });
  console.log('Admin user created successfully! Username: admin, Password: admin123');

  // 2. Seed Products
  console.log('Clearing old products...');
  await Product.deleteMany({});

  const products = [
    // Vegetables
    {
      name: 'Fresh Tomatoes',
      category: 'Vegetables',
      unit: 'Kg',
      price: 30,
      image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=600&q=80',
      featured: true,
      bestSeller: true,
      offer: '10% OFF'
    },
    {
      name: 'Red Onions',
      category: 'Vegetables',
      unit: 'Kg',
      price: 40,
      image: 'https://images.unsplash.com/photo-1618228473010-85f2a8c3dcdc?auto=format&fit=crop&w=600&q=80',
      featured: true,
      bestSeller: false,
      offer: ''
    },
    {
      name: 'Organic Potatoes',
      category: 'Vegetables',
      unit: 'Kg',
      price: 35,
      image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
      featured: false,
      bestSeller: true,
      offer: ''
    },
    {
      name: 'Fresh Brinjals',
      category: 'Vegetables',
      unit: 'Kg',
      price: 25,
      image: 'https://images.unsplash.com/photo-1624462966581-bc6d768cbce5?auto=format&fit=crop&w=600&q=80',
      featured: false,
      bestSeller: false,
      offer: 'Buy 1 Get 1 Free'
    },
    {
      name: 'Drumstick (Murungakkai)',
      category: 'Vegetables',
      unit: 'Piece',
      price: 5,
      image: 'https://images.unsplash.com/photo-1606588889101-1e967a216447?auto=format&fit=crop&w=600&q=80',
      featured: true,
      bestSeller: false,
      offer: ''
    },

    // Fruits
    {
      name: 'Robusta Banana',
      category: 'Fruits',
      unit: 'Dozen',
      price: 50,
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
      featured: true,
      bestSeller: true,
      offer: ''
    },
    {
      name: 'Salem Mangoes (Alphonso)',
      category: 'Fruits',
      unit: 'Kg',
      price: 80,
      image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
      featured: true,
      bestSeller: true,
      offer: '20% OFF'
    },
    {
      name: 'Kashmiri Apple',
      category: 'Fruits',
      unit: 'Kg',
      price: 150,
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
      featured: false,
      bestSeller: false,
      offer: ''
    },

    // Flowers
    {
      name: 'Red Roses',
      category: 'Flowers',
      unit: 'Bunch',
      price: 100,
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      featured: true,
      bestSeller: true,
      offer: 'Special Pack'
    },
    {
      name: 'Madurai Jasmine (Gundu Malli)',
      category: 'Flowers',
      unit: 'Muzham',
      price: 40,
      image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=600&q=80',
      featured: true,
      bestSeller: true,
      offer: 'Fresh Daily'
    },
    {
      name: 'Marigold (Samanthi)',
      category: 'Flowers',
      unit: 'Kg',
      price: 60,
      image: 'https://images.unsplash.com/photo-1589244159943-460088ed5c92?auto=format&fit=crop&w=600&q=80',
      featured: false,
      bestSeller: false,
      offer: ''
    },

    // Groceries
    {
      name: 'Premium Toor Dal',
      category: 'Groceries',
      unit: 'Kg',
      price: 120,
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
      featured: false,
      bestSeller: false,
      offer: ''
    },
    {
      name: 'Ponni Rice (Aged)',
      category: 'Groceries',
      unit: 'Kg',
      price: 55,
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
      featured: true,
      bestSeller: true,
      offer: '5% OFF'
    },
    {
      name: 'Pure Coconut Oil',
      category: 'Groceries',
      unit: 'Litre',
      price: 210,
      image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=600&q=80',
      featured: true,
      bestSeller: false,
      offer: ''
    }
  ];

  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products successfully!`);
  
  console.log('Seeding complete. Exiting.');
  process.exit(0);
};

seedData().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
