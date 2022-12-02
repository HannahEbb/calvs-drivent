import { prisma } from "@/config";

async function findBookingByUserId(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId
    },
    include: {
      Room: true
    }
  });
}

async function createBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId,
      roomId
    }
  });
}

async function findBookingById(bookingId: number) {
  return prisma.booking.findUnique({
    where: {
      id: bookingId
    }
  });
}

async function findAllBookingsByRoomId(roomId: number) {
  return prisma.booking.findMany({
    where: {
      roomId
    }
  });
} 

async function updateBooking(bookingId: number, roomId: number) {
  return prisma.booking.update({
    where: {
      id: bookingId
    },
    data: {
      roomId
    }
  });
}

const bookingRepository = {
  findBookingByUserId,
  createBooking,
  findBookingById,
  findAllBookingsByRoomId,
  updateBooking
};

export default bookingRepository;
