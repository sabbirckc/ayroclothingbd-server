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

    // 2. Re-seed AYRO authentic collection
    await clothesCollection.deleteMany({});
    const ayroClothes = [
      {
        title: 'AYRO Timeless Essential Burgundy Pinstripe Tailored Shirt',
        category: 'Formal Wear',
        price: 85,
        stock: 12,
        sizes: ['S', 'M', 'L', 'XL'],
        fabric: '100% Breathable Combed Cotton',
        brandOrigin: 'AYRO Timeless Essential',
        image: '/image-1.jpg',
        images: ['/image-1.jpg', '/image-8.jpg', '/image-10.jpg'],
        careInstructions: ['Cold Machine Wash', 'Warm Iron', 'Do Not Bleach', 'Hang Dry'],
        overview: 'Masterfully structured burgundy pinstripe silhouette engineered with high-thread combed cotton, tailored cuffs, and wrinkle-resistant finishing.',
        ownerEmail: 'designer@clothspace.com',
        ownerName: 'AYRO Clothing BD',
        rating: 4.9,
        reviewsCount: 18,
        ordersCount: 28,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        updatedAt: new Date()
      },
      {
        title: 'AYRO Deep Plum Oxford Button-Down Shirt',
        category: 'Casual Essentials',
        price: 75,
        stock: 15,
        sizes: ['M', 'L', 'XL', 'XXL'],
        fabric: '100% Premium Oxford Weave Cotton',
        brandOrigin: 'AYRO Timeless Essential',
        image: '/image-2.jpg',
        images: ['/image-2.jpg', '/image-1.jpg', '/image-10.jpg'],
        careInstructions: ['Machine Wash Gentle', 'Tumble Dry Low', 'Warm Iron'],
        overview: 'Everyday campus and casual elegance in a rich deep plum shade with natural mother-of-pearl buttons and relaxed button-down collar.',
        ownerEmail: 'designer@clothspace.com',
        ownerName: 'AYRO Clothing BD',
        rating: 4.8,
        reviewsCount: 14,
        ordersCount: 32,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
        updatedAt: new Date()
      },
      {
        title: 'AYRO Classic Sky Blue Chambray Workshirt',
        category: 'Casual Essentials',
        price: 80,
        stock: 10,
        sizes: ['S', 'M', 'L', 'XL'],
        fabric: 'Pure Indigo Chambray Cotton',
        brandOrigin: 'AYRO Timeless Essential',
        image: '/image-3.jpg',
        images: ['/image-3.jpg', '/image-6.jpg', '/image-11.jpg'],
        careInstructions: ['Machine Wash Cold', 'Line Dry in Shade', 'Iron Damp'],
        overview: 'Breathable sky blue chambray with rolled-cuff versatility, double-needle chain stitching, and structured modern yoke.',
        ownerEmail: 'examiner@clothspace.com',
        ownerName: 'Alex Rivera (Test Examiner)',
        rating: 5.0,
        reviewsCount: 22,
        ordersCount: 40,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
        updatedAt: new Date()
      },
      {
        title: 'AYRO Earth Taupe Textured Heavy Weave Shirt',
        category: 'Formal Wear',
        price: 90,
        stock: 8,
        sizes: ['S', 'M', 'L', 'XL'],
        fabric: 'Double-Ply Textured Cotton Weave',
        brandOrigin: 'AYRO Timeless Essential',
        image: '/image-4.jpg',
        images: ['/image-4.jpg', '/image-9.jpg', '/home-1.jpg'],
        careInstructions: ['Dry Clean Recommended', 'Cold Wash Delicate', 'Steam Low'],
        overview: 'Sophisticated textured weave with high tactile depth, featuring reinforced collar points and custom tortoiseshell buttons.',
        ownerEmail: 'designer@clothspace.com',
        ownerName: 'AYRO Clothing BD',
        rating: 4.9,
        reviewsCount: 16,
        ordersCount: 25,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        updatedAt: new Date()
      },
      {
        title: 'AYRO Minimalist Olive Linen Blend Shirt',
        category: 'Casual Essentials',
        price: 85,
        stock: 14,
        sizes: ['S', 'M', 'L', 'XL'],
        fabric: 'Breathable Linen & Long-Staple Cotton',
        brandOrigin: 'AYRO Timeless Essential',
        image: '/image-5.jpg',
        images: ['/image-5.jpg', '/image-4.jpg', '/image-9.jpg'],
        careInstructions: ['Gentle Machine Wash', 'Hang Dry in Breeze', 'Warm Iron'],
        overview: 'Lounge in tailored comfort. Earthy olive tone designed for tropical warmth, featuring hidden button tabs and curved hem.',
        ownerEmail: 'examiner@clothspace.com',
        ownerName: 'Alex Rivera (Test Examiner)',
        rating: 4.7,
        reviewsCount: 11,
        ordersCount: 19,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
        updatedAt: new Date()
      },
      {
        title: 'AYRO Powder Blue Tailored Yoke Shirt',
        category: 'Formal Wear',
        price: 78,
        stock: 11,
        sizes: ['S', 'M', 'L'],
        fabric: '80s Two-Ply Pinpoint Egyptian Cotton',
        brandOrigin: 'AYRO Timeless Essential',
        image: '/image-6.jpg',
        images: ['/image-6.jpg', '/image-3.jpg', '/image-1.jpg'],
        careInstructions: ['Dry Clean or Cold Wash', 'Press Crisp Low', 'Store on Hanger'],
        overview: 'Crisp executive silhouette with ergonomic back pleating, fused non-curl collar, and pristine powder blue finish.',
        ownerEmail: 'designer@clothspace.com',
        ownerName: 'AYRO Clothing BD',
        rating: 5.0,
        reviewsCount: 25,
        ordersCount: 38,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        updatedAt: new Date()
      },
      {
        title: 'AYRO Botanical Leaf Motif Cream Shirt',
        category: 'Streetwear',
        price: 95,
        stock: 9,
        sizes: ['M', 'L', 'XL', 'XXL'],
        fabric: 'Organic Soft Slub Weave Cotton',
        brandOrigin: 'AYRO Timeless Essential',
        image: '/image-7.jpg',
        images: ['/image-7.jpg', '/image-5.jpg', '/image-11.jpg'],
        careInstructions: ['Machine Wash Inside Out', 'Cold Water Only', 'Do Not Bleach'],
        overview: 'Abstract neutral botanical leaf motif printed on raw slub cotton for subtle sartorial distinction.',
        ownerEmail: 'designer@clothspace.com',
        ownerName: 'AYRO Clothing BD',
        rating: 4.8,
        reviewsCount: 17,
        ordersCount: 29,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        updatedAt: new Date()
      },
      {
        title: 'AYRO French Cuff Pinstripe Dress Shirt',
        category: 'Formal Wear',
        price: 92,
        stock: 7,
        sizes: ['S', 'M', 'L'],
        fabric: '100% Long-Staple Luxury Pinstripe Cotton',
        brandOrigin: 'AYRO Timeless Essential',
        image: '/image-8.jpg',
        images: ['/image-8.jpg', '/image-1.jpg', '/image-10.jpg'],
        careInstructions: ['Dry Clean Recommended', 'Cold Gentle Wash', 'Steam Press'],
        overview: 'Exquisite macro pinstripe detailing with convertible French cuffs and reinforced gauntlet buttons.',
        ownerEmail: 'examiner@clothspace.com',
        ownerName: 'Alex Rivera (Test Examiner)',
        rating: 4.9,
        reviewsCount: 13,
        ordersCount: 21,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        updatedAt: new Date()
      },
      {
        title: 'AYRO Signature Textured Button-Down with Neck Label',
        category: 'Vintage & Retro',
        price: 88,
        stock: 10,
        sizes: ['S', 'M', 'L'],
        fabric: '100% Textured Cotton with AYRO Neck Tag',
        brandOrigin: 'AYRO Timeless Essential',
        image: '/image-9.jpg',
        images: ['/image-9.jpg', '/image-4.jpg', '/image-2.jpg'],
        careInstructions: ['Hand Wash or Machine Delicate', 'Hang Dry', 'Low Iron'],
        overview: 'The signature AYRO 100% Cotton collared shirt with branded neck label, dual collar stay pockets, and bespoke resin buttons.',
        ownerEmail: 'designer@clothspace.com',
        ownerName: 'AYRO Clothing BD',
        rating: 4.8,
        reviewsCount: 19,
        ordersCount: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "AYRO Campaign Heritage Pinstripe ('Let's Go With AYRO')",
        category: 'Handcrafted Knitwear',
        price: 95,
        stock: 11,
        sizes: ['M', 'L', 'XL', 'XXL'],
        fabric: '100% Fine Combed Heritage Pinstripe Cotton',
        brandOrigin: 'AYRO Timeless Essential',
        image: '/image-10.jpg',
        images: ['/image-10.jpg', '/image-1.jpg', '/image-8.jpg'],
        careInstructions: ['Machine Wash Warm', 'Tumble Medium', 'Steam Press'],
        overview: "As featured in the official 'Let's Go With AYRO Timeless Essential' campaign. Pristine drape, contrast cuff lining, and tailored fit.",
        ownerEmail: 'designer@clothspace.com',
        ownerName: 'AYRO Clothing BD',
        rating: 5.0,
        reviewsCount: 34,
        ordersCount: 52,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'AYRO Indigo Dotted Micro-Print Casual Shirt',
        category: 'Streetwear',
        price: 82,
        stock: 9,
        sizes: ['M', 'L', 'XL'],
        fabric: 'Washed Indigo Chambray with Micro Polka Dots',
        brandOrigin: 'AYRO Timeless Essential',
        image: '/image-11.jpg',
        images: ['/image-11.jpg', '/image-3.jpg', '/image-6.jpg'],
        careInstructions: ['Cold Wash', 'Do Not Tumble Dry', 'Hang Dry'],
        overview: 'Contemporary washed indigo cotton adorned with subtle micro-dots for dynamic streetwear versatility.',
        ownerEmail: 'examiner@clothspace.com',
        ownerName: 'Alex Rivera (Test Examiner)',
        rating: 4.9,
        reviewsCount: 20,
        ordersCount: 36,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await clothesCollection.insertMany(ayroClothes);
    console.log(`Seeded ${ayroClothes.length} authentic AYRO Timeless Essential clothes successfully.`);

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
