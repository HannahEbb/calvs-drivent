import faker from "@faker-js/faker";
import { prisma } from "@/config";

export async function createHotel() {
  return prisma.hotel.create({
    data: {
      name: faker.name.firstName(),
      image: faker.image.business()
    }
  });
}

export async function createRoom(hotelId: number) {
  return prisma.room.create({
    data: {
      name: faker.name.lastName(),
      capacity: faker.datatype.number({ max: 300 }),
      hotelId
    }
  });
}

export async function findHotelWithRoomsById(hotelId: number) {
  return prisma.hotel.findUnique({
    where: { 
      id: hotelId 
    },
    include: { 
      Rooms: true 
    }
  });
}
