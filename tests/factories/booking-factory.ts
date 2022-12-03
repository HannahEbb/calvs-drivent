import faker from "@faker-js/faker";
import { prisma } from "@/config";

export async function createGenericBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId
    }
  });
}

export async function findBookingByUserId(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId
    },
    include: {
      Room: true
    }
  });
}

export async function findBookingById(bookingId: number) {
  return prisma.booking.findUnique({
    where: {
      id: bookingId
    },
    include: {
      Room: true
    }
  });
}
