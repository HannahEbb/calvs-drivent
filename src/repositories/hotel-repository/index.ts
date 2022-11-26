import { prisma } from "@/config";

async function findHotels() {
  return prisma.hotel.findMany();
}

async function findHotelByIdWithRooms(hotelId: number) {
  return prisma.hotel.findUnique({
    where: { 
      id: hotelId 
    },
    include: {
      Rooms: true
    }
  });
}

const hotelRepository = {
  findHotels,
  findHotelByIdWithRooms
};

export default hotelRepository;
