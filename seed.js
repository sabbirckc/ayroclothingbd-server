import bcrypt from 'bcryptjs';
import { connectDB, getCollections, client } from './db.js';

async function seed() {
  try {
    console.log('Connecting to MongoDB for AYRO seeding...');
    await connectDB();
    const { usersCollection, clothesCollection, ordersCollection } = getCollections();

    // 1. Seed Users (Examiner & AYRO Designer accounts)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('ClothSpace2026!', salt);

    const testUsers = [
      {
        name: 'Alex Rivera (Test Examiner)',
        email: 'examiner@clothspace.com',
        photoURL: '/client-review-1.jpg',
        password: passwordHash,
        role: 'designer',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'AYRO Clothing BD',
        email: 'designer@clothspace.com',
        photoURL: '/client-review-2.jpg',
        password: passwordHash,
        role: 'designer',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const u of testUsers) {
      await usersCollection.updateOne(
        { email: u.email },
        { $set: u },
        { upsert: true }
      );
    }
    console.log('Seeded test users successfully.');

    // 2. Clear all clothes to start clean
    await clothesCollection.deleteMany({});
    const ayroClothes = [];
    console.log('Cleared all clothes. Products ready to be added fresh.');

    if (ayroClothes.length > 0) {
      await clothesCollection.insertMany(ayroClothes);
    }
    console.log(`Seeded ${ayroClothes.length} clothes. Ready for new listings.`);

    // 3. Seed an initial sample order for the examiner
    const sampleItem = await clothesCollection.findOne({});
    if (sampleItem) {
      await ordersCollection.deleteMany({});
      await ordersCollection.insertOne({
        clothId: sampleItem._id,
        clothTitle: sampleItem.title,
        clothImage: sampleItem.image,
        clothCategory: sampleItem.category,
        fabric: sampleItem.fabric,
        brandOrigin: sampleItem.brandOrigin,
        size: 'L',
        quantity: 1,
        unitPrice: sampleItem.price,
        totalPrice: sampleItem.price,
        shippingAddress: 'House 42, Road 11, Banani, Dhaka, Bangladesh',
        phone: '+880 1712-345678',
        paymentMethod: 'Cash on Delivery',
        notes: 'Please pack in AYRO Timeless Essential designer box.',
        buyerEmail: 'examiner@clothspace.com',
        buyerName: 'Alex Rivera (Test Examiner)',
        sellerEmail: sampleItem.ownerEmail,
        sellerName: sampleItem.ownerName,
        status: 'Confirmed',
        orderDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Seeded sample order for examiner test.');
    }

    console.log('AYRO Database seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await client.close();
  }
}

seed();
