import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.event.deleteMany();

  // Create sample events
  const event1 = await prisma.event.create({
    data: {
      name: 'Tech Conference 2024',
      date: new Date('2024-09-15'),
      totalSeats: 100,
      availableSeats: 100,
      pricePerSeat: '99.99',
    },
  });

  const event2 = await prisma.event.create({
    data: {
      name: 'Web Development Workshop',
      date: new Date('2024-08-20'),
      totalSeats: 30,
      availableSeats: 30,
      pricePerSeat: '49.99',
    },
  });

  const event3 = await prisma.event.create({
    data: {
      name: 'JavaScript Meetup',
      date: new Date('2024-08-10'),
      totalSeats: 50,
      availableSeats: 50,
      pricePerSeat: '0.00',
    },
  });

  console.log('Seeding completed:', { event1, event2, event3 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
