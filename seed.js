import bcrypt from 'bcryptjs';
import { connectDB, getCollections, client } from './db.js';

async function seed() {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await connectDB();
    const { usersCollection, clothesCollection, ordersCollection } = getCollections();

    // 1. Seed Users (Examiner & Designer accounts)
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
        name: 'Elena Rostova Atelier',
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

    // 2. Clear existing sample clothes or re-seed
    const count = await clothesCollection.countDocuments();
    if (count < 11) {
      await clothesCollection.deleteMany({});
      const sampleClothes = [
        {
          title: 'Bespoke Structured Wool Blend Blazer',
          category: 'Formal Wear',
          price: 185,
          stock: 8,
          sizes: ['S', 'M', 'L', 'XL'],
          fabric: 'Italian Merino Wool & Mulberry Silk',
          brandOrigin: 'Milanese Tailoring Studio',
          image: '/image-1.jpg',
          images: ['/image-1.jpg', '/home-1.jpg', '/image-6.jpg'],
          careInstructions: ['Dry Clean Only', 'Steam Press Low', 'Store On Padded Hanger'],
          overview: 'Masterfully structured bespoke blazer boasting handcrafted lapels, cupro lining, and high-twist wool engineered for all-day wrinkle resistance.',
          ownerEmail: 'designer@clothspace.com',
          ownerName: 'Elena Rostova Atelier',
          rating: 4.9,
          reviewsCount: 14,
          ordersCount: 22,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
          updatedAt: new Date()
        },
        {
          title: 'Cyberpunk Oversized Acid-Wash Hoodie',
          category: 'Streetwear',
          price: 115,
          stock: 14,
          sizes: ['M', 'L', 'XL', 'XXL'],
          fabric: '480 GSM Heavyweight French Terry Cotton',
          brandOrigin: 'Neo-Tokyo Underground',
          image: '/image-2.jpg',
          images: ['/image-2.jpg', '/image-7.jpg', '/image-11.jpg'],
          careInstructions: ['Cold Machine Wash Inside Out', 'Tumble Dry Low', 'Do Not Bleach'],
          overview: 'Heavy-gauge French Terry silhouette featuring garment acid wash, dropped shoulders, rib-knit cuffs, and concealed side-seam pockets.',
          ownerEmail: 'designer@clothspace.com',
          ownerName: 'Elena Rostova Atelier',
          rating: 4.8,
          reviewsCount: 19,
          ordersCount: 35,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
          updatedAt: new Date()
        },
        {
          title: 'Vintage 90s Distressed Denim Bomber',
          category: 'Vintage & Retro',
          price: 140,
          stock: 5,
          sizes: ['S', 'M', 'L'],
          fabric: '13.5oz Kurabo Selvedge Denim',
          brandOrigin: 'Kojima Artisan Heritage',
          image: '/image-3.jpg',
          images: ['/image-3.jpg', '/image-10.jpg', '/home-2.jpg'],
          careInstructions: ['Hand Wash Cold', 'Line Dry In Shade', 'Wash Rarely to Preserve Patina'],
          overview: 'Authentic 90s cut salvaged and re-tailored with antique brass buttons, quilted orange satin lining, and custom hand-distressed vintage fading.',
          ownerEmail: 'examiner@clothspace.com',
          ownerName: 'Alex Rivera (Test Examiner)',
          rating: 5.0,
          reviewsCount: 8,
          ordersCount: 12,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
          updatedAt: new Date()
        },
        {
          title: 'Handcrafted Cable-Knit Cashmere Cardigan',
          category: 'Handcrafted Knitwear',
          price: 165,
          stock: 6,
          sizes: ['S', 'M', 'L', 'XL'],
          fabric: '100% Pure Mongolian Cashmere',
          brandOrigin: 'Highland Heritage Weavers',
          image: '/image-4.jpg',
          images: ['/image-4.jpg', '/image-9.jpg', '/image-1.jpg'],
          careInstructions: ['Hand Wash With Wool Detergent', 'Dry Flat', 'Do Not Wring'],
          overview: 'Exquisitely soft 6-ply pure cashmere yarn spun by artisan weavers, featuring deep tortoiseshell horn buttons and heritage honeycomb cabling.',
          ownerEmail: 'designer@clothspace.com',
          ownerName: 'Elena Rostova Atelier',
          rating: 4.9,
          reviewsCount: 11,
          ordersCount: 18,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
          updatedAt: new Date()
        },
        {
          title: 'Minimalist Tailored Linen Relaxed Trousers',
          category: 'Casual Essentials',
          price: 95,
          stock: 12,
          sizes: ['S', 'M', 'L', 'XL'],
          fabric: '100% Belgian Washed Flax Linen',
          brandOrigin: 'Nordic Clean Studio',
          image: '/image-5.jpg',
          images: ['/image-5.jpg', '/image-8.jpg', '/image-10.jpg'],
          careInstructions: ['Machine Wash Gentle', 'Hang Dry In Breeze', 'Warm Iron While Damp'],
          overview: 'Airy, breathable summer trousers engineered with double front pleats, elasticated internal waist cinch, and relaxed tapered ankle cuffs.',
          ownerEmail: 'examiner@clothspace.com',
          ownerName: 'Alex Rivera (Test Examiner)',
          rating: 4.7,
          reviewsCount: 7,
          ordersCount: 16,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
          updatedAt: new Date()
        },
        {
          title: 'Midnight Velvet Embroidered Evening Gown',
          category: 'Formal Wear',
          price: 240,
          stock: 4,
          sizes: ['S', 'M', 'L'],
          fabric: 'French Silk-Velvet with Gold Filigree',
          brandOrigin: 'Haute Couture Parisienne',
          image: '/image-6.jpg',
          images: ['/image-6.jpg', '/home-1.jpg', '/image-1.jpg'],
          careInstructions: ['Professional Dry Clean Only', 'Never Iron Direct Velvet', 'Steam Only'],
          overview: 'Dramatic floor-length evening gown crafted from deep obsidian silk-velvet with shimmering gold botanical filigree embroidery and a subtle side slit.',
          ownerEmail: 'designer@clothspace.com',
          ownerName: 'Elena Rostova Atelier',
          rating: 5.0,
          reviewsCount: 23,
          ordersCount: 30,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          updatedAt: new Date()
        },
        {
          title: 'Urban Tactical Cargo Trench Jacket',
          category: 'Streetwear',
          price: 155,
          stock: 9,
          sizes: ['M', 'L', 'XL', 'XXL'],
          fabric: 'Weatherproof Ripstop Organic Cotton',
          brandOrigin: 'Berlin Modest Dynamics',
          image: '/image-7.jpg',
          images: ['/image-7.jpg', '/image-2.jpg', '/image-11.jpg'],
          careInstructions: ['Wipe With Damp Cloth', 'Cold Gentle Cycle', 'Water-Repellent Refresh Spray'],
          overview: 'High-utility storm parka equipped with 8 modular magnetic snap pockets, fidlock storm hood, and breathable water-resistant coating.',
          ownerEmail: 'designer@clothspace.com',
          ownerName: 'Elena Rostova Atelier',
          rating: 4.8,
          reviewsCount: 15,
          ordersCount: 27,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          updatedAt: new Date()
        },
        {
          title: 'Retro Paisley Silk Reversible Kimono',
          category: 'Vintage & Retro',
          price: 130,
          stock: 7,
          sizes: ['S', 'M', 'L'],
          fabric: '100% Grade 6A Mulberry Silk',
          brandOrigin: 'Kyoto Silk Archive',
          image: '/image-8.jpg',
          images: ['/image-8.jpg', '/image-3.jpg', '/image-5.jpg'],
          careInstructions: ['Delicate Hand Wash Only', 'Use Silk Shampoo', 'Air Dry Flat Away From Sun'],
          overview: 'Fully reversible artisan kimono robe displaying intricate 1970s paisley motifs on one side and lustrous solid emerald silk on the reverse.',
          ownerEmail: 'examiner@clothspace.com',
          ownerName: 'Alex Rivera (Test Examiner)',
          rating: 4.9,
          reviewsCount: 9,
          ordersCount: 14,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          updatedAt: new Date()
        },
        {
          title: 'Chunky Mohair Open-Stitch Pullover',
          category: 'Handcrafted Knitwear',
          price: 120,
          stock: 10,
          sizes: ['S', 'M', 'L'],
          fabric: 'South African Brushed Mohair & Alpaca',
          brandOrigin: 'Artisan Wool Loft',
          image: '/image-9.jpg',
          images: ['/image-9.jpg', '/image-4.jpg', '/image-10.jpg'],
          careInstructions: ['Dry Clean or Cold Hand Soak', 'Never Tumble Dry', 'Lay Flat on Towel'],
          overview: 'Cloud-soft sheer knit sweater hand-loomed with brushed mohair filaments in an ombre cloud wash. Incredibly light yet delightfully warm.',
          ownerEmail: 'designer@clothspace.com',
          ownerName: 'Elena Rostova Atelier',
          rating: 4.8,
          reviewsCount: 12,
          ordersCount: 20,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Raw Hem Selvedge Utility Overshirt',
          category: 'Casual Essentials',
          price: 110,
          stock: 11,
          sizes: ['M', 'L', 'XL', 'XXL'],
          fabric: '10oz Natural Slub Cotton Canvas',
          brandOrigin: 'Workwear Craft Workshop',
          image: '/image-10.jpg',
          images: ['/image-10.jpg', '/image-3.jpg', '/image-7.jpg'],
          careInstructions: ['Machine Wash Warm', 'Tumble Medium', 'Iron While Steaming'],
          overview: 'Rugged overshirt built for layering, finished with raw selvedge chain-stitching, reinforced elbow patches, and heavy corozo buttons.',
          ownerEmail: 'designer@clothspace.com',
          ownerName: 'Elena Rostova Atelier',
          rating: 4.7,
          reviewsCount: 16,
          ordersCount: 25,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Avant-Garde Draped Asymmetrical Parka',
          category: 'Streetwear',
          price: 195,
          stock: 5,
          sizes: ['M', 'L', 'XL'],
          fabric: 'Technical Memory Twill & DWR Nylon',
          brandOrigin: 'Seoul Design Collective',
          image: '/image-11.jpg',
          images: ['/image-11.jpg', '/home-1.jpg', '/image-2.jpg'],
          careInstructions: ['Cold Gentle Wash', 'Do Not Tumble Dry', 'Hang Dry'],
          overview: 'Architectural streetwear outerwear engineered with dramatic diagonal zipper closure, convertible storm collar, and weather-defying memory twill.',
          ownerEmail: 'examiner@clothspace.com',
          ownerName: 'Alex Rivera (Test Examiner)',
          rating: 5.0,
          reviewsCount: 18,
          ordersCount: 31,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await clothesCollection.insertMany(sampleClothes);
      console.log('Seeded 11 authentic designer clothes successfully.');
    } else {
      console.log(`Clothes collection already contains ${count} items.`);
    }

    // 3. Seed an initial sample order for the examiner
    const orderCount = await ordersCollection.countDocuments();
    if (orderCount === 0) {
      const sampleItem = await clothesCollection.findOne({});
      if (sampleItem) {
        await ordersCollection.insertOne({
          clothId: sampleItem._id,
          clothTitle: sampleItem.title,
          clothImage: sampleItem.image,
          clothCategory: sampleItem.category,
          fabric: sampleItem.fabric,
          brandOrigin: sampleItem.brandOrigin,
          size: 'M',
          quantity: 1,
          unitPrice: sampleItem.price,
          totalPrice: sampleItem.price,
          shippingAddress: '742 Evergreen Terrace, Fashion District Suite 4B',
          phone: '+1 (555) 234-5678',
          paymentMethod: 'Direct Designer Escrow',
          notes: 'Please gift wrap in recyclable designer tissue paper.',
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
    }

    console.log('Database seeding finished successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await client.close();
  }
}

seed();
